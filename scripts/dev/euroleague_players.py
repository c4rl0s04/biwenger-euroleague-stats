"""
Euroleague Player Photo Scraper
================================
1. Clicks "Cargar más" repeatedly until all players are loaded
2. Visits each player page and extracts their portrait URL
3. Saves to euroleague_players.csv

Requirements:
    pip install playwright
    playwright install chromium

Usage:
    python euroleague_players.py
"""

import csv
import re
import time
from playwright.sync_api import sync_playwright

BASE_URL     = "https://www.euroleaguebasketball.net"
LISTINGS_URL = f"{BASE_URL}/es/euroleague/players/"
OUTPUT_FILE  = "src/lib/data/players/euroleague_players.csv"
DELAY_SEC    = 1.0


def extract_player_info(href: str):
    m = re.search(r'/players/([^/]+)/([^/]+)/?$', href)
    return (m.group(1), m.group(2)) if m else ("", "")


def slug_to_display(slug: str) -> str:
    return re.sub(r'\s+', ' ', slug.replace("-", " ")).strip().upper()


def find_portrait(html: str, player_name_slug: str) -> str:
    display_name = slug_to_display(player_name_slug)
    pattern = re.compile(
        r'(https://media-cdn\.cortextech\.io/[^"]+)"[^>]{0,150}alt="' + re.escape(display_name) + '"',
        re.IGNORECASE
    )
    m = pattern.search(html)
    return m.group(1) if m else ""


def load_all_players(page) -> list[dict]:
    print(f"Loading {LISTINGS_URL} ...")
    page.goto(LISTINGS_URL, wait_until="networkidle")
    page.wait_for_timeout(2000)

    # --- Dismiss the OneTrust Cookie Banner ---
    try:
        print("  Checking for cookie banner...")
        cookie_btn = page.wait_for_selector("#onetrust-accept-btn-handler", timeout=5000)
        if cookie_btn:
            cookie_btn.click()
            print("  Cookie banner dismissed.")
            page.wait_for_timeout(1000) # Give the overlay a moment to fade out
    except Exception:
        print("  No cookie banner found, continuing...")

    # Click "Cargar más" until it disappears
    clicks = 0
    while True:
        # Looking for "Cargar más" (fixed character encoding)
        btn = page.query_selector("button:has-text('Cargar más')")
        if not btn:
            break
        btn.scroll_into_view_if_needed()
        
        # force=True bypasses potential invisible overlays hindering the click
        btn.click(force=True)
        
        page.wait_for_timeout(2000)
        clicks += 1
        count = len(page.query_selector_all("a[class*='playerCard']"))
        print(f"  Click {clicks}: {count} players loaded")

    cards = page.query_selector_all("a[class*='playerCard']")
    print(f"\n  ✅ Done — {len(cards)} players total\n")

    players = []
    for card in cards:
        href = card.get_attribute("href") or ""
        name, code = extract_player_info(href)
        if name:
            players.append({
                "player_name": name,
                "player_code": code,
                "profile_url": f"{BASE_URL}{href}",
            })
    return players


def scrape():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page    = browser.new_page()

        players = load_all_players(page)

        if not players:
            print("  ⚠️  No players found.")
            browser.close()
            return

        rows  = []
        total = len(players)

        for i, player in enumerate(players, start=1):
            name = player["player_name"]
            code = player["player_code"]
            url  = player["profile_url"]

            print(f"[{i}/{total}]  {name}  [{code}]")

            try:
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_timeout(800)
                html = page.content()
            except Exception as e:
                print(f"         ⚠️  Failed: {e}")
                html = ""

            image_url = find_portrait(html, name)

            if image_url:
                print(f"         ✅  {image_url}")
            else:
                print(f"         ❌  No portrait (searched alt='{slug_to_display(name)}')")

            rows.append({
                "player_name": name,
                "player_code": code,
                "image_url":   image_url,
                "profile_url": url,
            })

            time.sleep(DELAY_SEC)

        browser.close()

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["player_name", "player_code", "image_url", "profile_url"])
        writer.writeheader()
        writer.writerows(rows)

    found   = sum(1 for r in rows if r["image_url"])
    missing = total - found
    print(f"\n{'='*60}")
    print(f"✅  Saved {total} players to {OUTPUT_FILE}")
    print(f"   With photo:    {found}")
    print(f"   Without photo: {missing}")
    if missing:
        print("\n  Missing players:")
        for r in rows:
            if not r["image_url"]:
                print(f"    - {r['player_name']}  ({r['profile_url']})")


if __name__ == "__main__":
    scrape()