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

            # Extract Team Name AND Player Image in one pass
            img_url = None
            team_name = None

            for img in page.css('img'):
                href = img.attrib.get('href') or ''
                alt  = img.attrib.get('alt')  or ''
                src  = (
                    img.attrib.get('srcset')
                    or img.attrib.get('data-srcset')
                    or img.attrib.get('src')
                    or ''
                )

                is_cdn = 'media-cdn.incrowdsports.com' in src
                is_team_logo = '/teams/' in href

                if is_cdn and is_team_logo and not team_name:
                    # This is the team logo → grab the team name from alt
                    team_name = alt or None

                elif is_cdn and not is_team_logo and not img_url:
                    # This is the player photo (CDN image without a /teams/ link)
                    img_url = src.split(',')[0].split(' ')[0].strip()

                # Stop early once we have both
                if img_url and team_name:
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

    tasks = [
        asyncio.ensure_future(fetch_one(semaphore, player, i + 1, total))
        for i, player in enumerate(players)
    ]

    # Stream results as each task finishes (not all at the end)
    for coro in asyncio.as_completed(tasks):
        result = await coro
        # Emit immediately so TypeScript can start DB writes right away
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
