import httpx
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://animetake.tv/',
}

client = httpx.Client(headers=headers, follow_redirects=True)
show_url = "https://animetake.tv/anime/trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs/"

resp2 = client.get(show_url)
soup2 = BeautifulSoup(resp2.text, 'html.parser')
for a in soup2.select("a[href]"):
    href = a.get("href", "")
    if "episode" in href.toLowerCase() if hasattr(href, 'toLowerCase') else "episode" in href.lower() or "watch" in href.lower():
        print("Link:", href, "Text:", a.get_text(strip=True)[:40])
