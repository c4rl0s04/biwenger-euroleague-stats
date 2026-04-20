import asyncio
import json
import sys
import re
import unicodedata
from scrapling.fetchers import StealthyFetcher

# ─── CONCURRENCY SETTINGS ────────────────────────────────────────────────────
# How many browser pages to open in parallel.
# 5 is a good balance: fast but not aggressive enough to trigger rate limiting.
CONCURRENCY = 5
# ─────────────────────────────────────────────────────────────────────────────


def slugify(text):
    """Convert player name to Euroleague URL slug format."""
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text


async def fetch_one(semaphore, player, index, total):
    """Fetch image and team for a single player, respecting the semaphore."""
    player_id = player.get('id')
    name = player.get('name', 'Player')
    code = player.get('euroleague_code')

    if not code:
        print(f"[{index}/{total}] ⚠️ Skip: No code for {name}", file=sys.stderr)
        return {"id": player_id, "success": False, "name": name}

    slug = slugify(name)
    url = f"https://www.euroleaguebasketball.net/euroleague/players/{slug}/{code}/"
    print(f"[{index}/{total}] 🔍 {name}", file=sys.stderr)

    async with semaphore:
        try:
            page = await StealthyFetcher.async_fetch(
                url,
                headless=True,
                network_idle=True,
                disable_resources=False,
                timeout=45000,
                wait=2000,
            )

            # 1. Player image — any incrowdsports CDN URL
            img_url = None
            for img in page.css('img'):
                src = (
                    img.attrib.get('srcset')
                    or img.attrib.get('data-srcset')
                    or img.attrib.get('src')
                    or ''
                )
                if 'media-cdn.incrowdsports.com' in src:
                    img_url = src.split(',')[0].split(' ')[0].strip()
                    break

            # 2. Team name — from the team logo's alt attribute
            team_name = None
            for img in page.css('img'):
                href = img.attrib.get('href') or ''
                alt = img.attrib.get('alt') or ''
                if '/teams/' in href and alt:
                    team_name = alt
                    break

            result = {
                "id": player_id,
                "name": name,
                "success": bool(img_url),
                "url": img_url or None,
                "team_name": team_name,
            }

            if img_url:
                print(f"   ✅ {name}: {img_url[:55]}... (Team: {team_name or 'unknown'})", file=sys.stderr)
            else:
                print(f"   ⚠️  No image found for {name}", file=sys.stderr)

            return result

        except Exception as e:
            print(f"   ❌ Error for {name}: {e}", file=sys.stderr)
            return {"id": player_id, "success": False, "error": str(e), "name": name}


async def process_players(players):
    total = len(players)
    print(f"🚀 Starting parallel sync: {total} players, {CONCURRENCY} concurrent tabs", file=sys.stderr)

    semaphore = asyncio.Semaphore(CONCURRENCY)

    # Create all tasks
    tasks = [
        fetch_one(semaphore, player, i + 1, total)
        for i, player in enumerate(players)
    ]

    # Run all tasks concurrently, respecting the semaphore
    # as_completed would be ideal, but gather preserves order for simplicity
    results = await asyncio.gather(*tasks)

    # Emit each result as a JSON line for the TypeScript orchestrator
    for result in results:
        print(json.dumps(result), flush=True)


def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            return
        players = json.loads(input_data)
    except Exception as e:
        print(f"Invalid input: {e}", file=sys.stderr)
        return

    asyncio.run(process_players(players))


if __name__ == "__main__":
    main()
