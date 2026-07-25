import httpx
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://animetake.tv/',
}

client = httpx.Client(headers=headers, follow_redirects=True)

try:
    url = "https://animetake.tv/search/?search=Trapped+in+a+Dating+Sim"
    resp = client.get(url)
    soup = BeautifulSoup(resp.text, 'html.parser')
    for item in soup.select('.component-animelist'):
        a = item.select_one('.animeposter a[href]')
        show_url = a['href'] if a['href'].startswith('http') else 'https://animetake.tv' + a['href']
        print("Show URL:", show_url)
        
        resp2 = client.get(show_url)
        soup2 = BeautifulSoup(resp2.text, 'html.parser')
        ep_a = soup2.select_one("a[href*='/watch/']")
        if ep_a:
            ep_url = ep_a['href'] if ep_a['href'].startswith('http') else 'https://animetake.tv' + ep_a['href']
            print("Ep URL:", ep_url)
            
            resp3 = client.get(ep_url)
            print("Ep status:", resp3.status_code)
            soup3 = BeautifulSoup(resp3.text, 'html.parser')
            
            print("Iframes found:", [i.get('src') for i in soup3.find_all('iframe')])
            print("All video tags:", [v.get('src') for v in soup3.find_all('video')])
            
            # Print any iframe/player container HTML
            player_div = soup3.select_one('#player, .player, .video-player, .player-container, #embed')
            print("Player div:", player_div)
        break
except Exception as e:
    print("Error:", e)
