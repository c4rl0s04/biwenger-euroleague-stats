import sys
import json
from scrapling.fetchers import StealthyFetcher

def get_player_image(url):
    try:
        # Initialize the stealthy fetcher with browser automation
        # This will pass the Vercel security challenge automatically
        page = StealthyFetcher.fetch(url, headless=True, network_idle=True)
        
        # Search for the image link in multiple places
        img_url = None
        
        # 1. Check OpenGraph meta tags (best quality usually)
        img_url = page.css('meta[property="og:image"]::attr(content)').get()
        
        # 2. Check JSON metadata in the script tag
        if not img_url:
            img_url = page.css('script:contains("photo")::text').re_first(r'"photo":"(https://media-cdn\.cortextech\.io/[^"]+)"')

        # 3. Check standard image tags
        if not img_url:
            img_url = page.css('img[src*="cortextech"]::attr(src)').get()

        if img_url:
            return {"success": True, "url": img_url}
        else:
            return {"success": False, "error": "Image not found on page"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No URL provided"}))
        return

    target_url = sys.argv[1]
    result = get_player_image(target_url)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
