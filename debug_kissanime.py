import httpx
from bs4 import BeautifulSoup
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

ep_url = "https://kissanime.com.vc/grand-blue-dreaming-season-2-episode-1/"
try:
    with httpx.Client(headers=headers, follow_redirects=True, timeout=15) as client:
        resp = client.get(ep_url)
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Check iframes
        iframes = soup.find_all("iframe")
        print(f"Found {len(iframes)} iframes")
        for f in iframes:
            print("Iframe src:", f.get("src"))
            
        # Check for any source or video tags
        videos = soup.find_all("video")
        print(f"Found {len(videos)} videos")
        
        # Check for typical embed domains in text
        embeds = re.findall(r'https?://[^\'"<>\s]+\.(?:mp4|m3u8)[^\'"<>\s]*', resp.text)
        print("Embeds found:", len(embeds))
        
        # Print a chunk of HTML if nothing found
        if not iframes and not embeds:
            print("HTML snippet:", resp.text[:1000])
except Exception as e:
    print("Error:", e)
