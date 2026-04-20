import json
import sys
import re
import unicodedata
from scrapling import Fetcher

def slugify(text):
    """Convert player name to Euroleague URL slug format."""
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

def process_players(players):
    print(f"🚀 Initializing high-speed stealth browser...", file=sys.stderr)
    
    # Initialize the fetcher ONCE to keep the browser open
    fetcher = Fetcher(headless=True, network_idle=True)
    
    print(f"🚀 Processing {len(players)} players sequentially...", file=sys.stderr)

    for i, player in enumerate(players):
        player_id = player.get('id')
        name = player.get('name', 'Player')
        code = player.get('euroleague_code')

        if not code:
            print(f"[{i+1}/{len(players)}] ⚠️ Skip: No Euroleague code for {name}", file=sys.stderr)
            continue

        slug = slugify(name)
        url = f"https://www.euroleaguebasketball.net/euroleague/players/{slug}/{code}/"
        
        print(f"[{i+1}/{len(players)}] 🔍 {name} → {url}", file=sys.stderr)

        try:
            # Use the persistent fetcher session
            page = fetcher.get(url)

            # 1. Extract Player Image
            selector = f'img[alt*="{name.upper()}"]'
            img_url = page.css(f'{selector}::attr(data-srcset)').get()
            if not img_url:
                img_url = page.css(f'{selector}::attr(srcset)').get()
            if not img_url:
                img_url = page.css(f'{selector}::attr(src)').get()

            # 2. Extract Team Name from the team logo
            team_selector = 'img[href*="/teams/"]'
            team_name = page.css(f'{team_selector}::attr(alt)').get()

            result = {
                "id": player_id,
                "name": name,
                "success": False,
                "team_name": team_name
            }

            if img_url:
                clean_url = img_url.split(',')[0].split(' ')[0].strip()
                result["success"] = True
                result["url"] = clean_url
                print(f"   ✅ Found: {clean_url} ({team_name or 'No Team'})", file=sys.stderr)
            else:
                print(f"   ⚠️  No image found for {name}", file=sys.stderr)
            
            # Print result as JSON line
            print(json.dumps(result), flush=True)

        except Exception as e:
            print(f"   ❌ Error for {name}: {str(e)}", file=sys.stderr)
            print(json.dumps({"id": player_id, "success": False, "error": str(e), "name": name}), flush=True)

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            return
        players = json.loads(input_data)
    except Exception as e:
        print(f"Invalid input: {str(e)}", file=sys.stderr)
        return

    process_players(players)

if __name__ == "__main__":
    main()
