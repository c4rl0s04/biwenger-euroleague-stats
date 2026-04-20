import json
import sys
import re
import unicodedata
from scrapling.fetchers import StealthyFetcher

def slugify(text):
    """Convert player name to Euroleague URL slug format.
    e.g. 'Alpha Diallo' -> 'alpha-diallo'
         'López-Arostegui' -> 'lopez-arostegui'
    """
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

def fetch_player_image(player):
    player_id = player.get('id')
    name = player.get('name', 'Player')
    code = player.get('euroleague_code', '').replace('P', '').zfill(6)

    # Build URL the same way we did in the successful test
    slug = slugify(name)
    url = f"https://www.euroleaguebasketball.net/euroleague/players/{slug}/{code}/"

    print(f"   🔍 Fetching: {name} → {url}", file=sys.stderr)

    try:
        # Use the exact same approach as test_scrapling.py (proven to work)
        page = StealthyFetcher.fetch(url, headless=True, network_idle=True)

        # Match the player's image by its alt attribute (uppercased name)
        selector = f'img[alt*="{name.upper()}"]'
        img_url = page.css(f'{selector}::attr(data-srcset)').get()

        if not img_url:
            img_url = page.css(f'{selector}::attr(srcset)').get()

        if not img_url:
            img_url = page.css(f'{selector}::attr(src)').get()

        # 2. Extract Team Name from the team logo
        # Based on user discovery: <img ... alt="AS Monaco" href="/es/euroleague/teams/as-monaco/mco/" ...>
        team_selector = 'img[href*="/teams/"]'
        team_name = page.css(f'{team_selector}::attr(alt)').get()

        if img_url:
            # Take the first URL from srcset (might have multiple resolutions)
            clean_url = img_url.split(',')[0].split(' ')[0].strip()
            print(f"   ✅ Found: {clean_url} ({team_name or 'No Team'})", file=sys.stderr)
            return {
                "id": player_id, 
                "success": True, 
                "url": clean_url, 
                "name": name, 
                "team_name": team_name
            }
        else:
            print(f"   ⚠️  No image found for {name}", file=sys.stderr)
            return {
                "id": player_id, 
                "success": False, 
                "error": "Image not found", 
                "name": name,
                "team_name": team_name
            }

    except Exception as e:
        print(f"   ❌ Error for {name}: {str(e)}", file=sys.stderr)
        return {"id": player_id, "success": False, "error": str(e), "name": name}

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print("No input received.", file=sys.stderr)
            return
        players = json.loads(input_data)
    except Exception as e:
        print(f"Invalid input: {str(e)}", file=sys.stderr)
        return

    print(f"🚀 Processing {len(players)} players sequentially...", file=sys.stderr)

    for i, player in enumerate(players):
        print(f"[{i+1}/{len(players)}]", file=sys.stderr, end=" ")
        result = fetch_player_image(player)
        # Print each result as a separate JSON line to stdout
        print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
