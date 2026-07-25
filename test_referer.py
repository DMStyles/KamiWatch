import httpx
from bs4 import BeautifulSoup

show_url = "https://animetake.tv/anime/trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs/"
ep_url = "https://animetake.tv/watch/9998269382/"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': show_url,
}

client = httpx.Client(headers=headers, follow_redirects=True)
resp = client.get(ep_url)
print("Status code:", resp.status_code)
if resp.status_code == 200:
    soup = BeautifulSoup(resp.text, 'html.parser')
    print("Page Title:", soup.title.text if soup.title else '')
    print("Iframes:", [i.get('src') for i in soup.find_all('iframe')])
    print("Video tags:", [v.get('src') for v in soup.find_all('video')])
    for iframe in soup.find_all('iframe'):
        print("Iframe HTML:", iframe)
