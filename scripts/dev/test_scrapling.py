from scrapling.fetchers import StealthyFetcher
import json

def test_single_player():
    url = "https://www.euroleaguebasketball.net/euroleague/players/alpha-diallo/011226/"
    print(f"🚀 Testing Scrapling on: {url}")
    
    try:
        # Fetch the page with stealth mode
        # network_idle=True is important here to allow lazy-loading scripts to run
        page = StealthyFetcher.fetch(url, headless=True, network_idle=True)
        
        # Find the image that matches the player name in the alt attribute
        player_name = "ALPHA DIALLO"
        # We look for an img tag where the alt attribute contains the player name
        selector = f'img[alt*="{player_name}"]'
        
        # Try to get the data-srcset first (common in lazy-loading)
        img_url = page.css(f'{selector}::attr(data-srcset)').get()
        
        # Fallback to srcset
        if not img_url:
            img_url = page.css(f'{selector}::attr(srcset)').get()
            
        # Fallback to standard src
        if not img_url:
            img_url = page.css(f'{selector}::attr(src)').get()
            
        if not img_url:
             # Last resort: search the entire page text for the cortextech pattern
             import re
             matches = re.findall(r'https://media-cdn\.cortextech\.io/[a-f0-9-]+\.png', page.text)
             if matches:
                 img_url = matches[0]

        if img_url:
            # Clean up the URL (sometimes srcset contains multiple resolutions)
            clean_url = img_url.split(',')[0].split(' ')[0].strip()
            print(f"✅ SUCCESS! Found image: {clean_url}")
            return clean_url
        else:
            print("❌ FAILED: Could not find any CortexTech image URL on the page.")
            return None
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return None

if __name__ == "__main__":
    test_single_player()
