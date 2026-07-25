import httpx
from bs4 import BeautifulSoup
import urllib.parse
import json

title = "Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs"
ep_num = "3"

search_url = f"https://anikototv.to/search?keyword={urllib.parse.quote(title)}"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

client = httpx.Client(headers=headers, follow_redirects=True)
resp = client.get(search_url)
soup = BeautifulSoup(resp.text, 'html.parser')
show_card = soup.select_one('.film-poster a[href]')
if show_card:
    href = show_card['href']
    show_page = f"https://anikototv.to{href}" if href.startswith('/') else href
    print("AniKoto Show Page:", show_page)
    
    data_id = show_card.get('data-id') or href.strip('/').split('/')[-1]
    ep_resp = client.get(f"https://anikototv.to/ajax/v2/episode/list/{data_id}")
    ep_data = ep_resp.json()
    print("Episodes Ajax status:", ep_data.get('status'))
    if ep_data.get('html'):
        ep_soup = BeautifulSoup(ep_data['html'], 'html.parser')
        target_ep = ep_soup.select_one(f"a[data-number='{ep_num}']") or ep_soup.select_one("a[data-id]")
        if target_ep:
            ep_id = target_ep.get('data-id')
            print("Target Episode Data ID:", ep_id)
            
            # Resolve servers
            servers_resp = client.get(f"https://anikototv.to/ajax/v2/episode/servers?episodeId={ep_id}")
            servers_data = servers_resp.json()
            if servers_data.get('html'):
                srv_soup = BeautifulSoup(servers_data['html'], 'html.parser')
                srv_item = srv_soup.select_one(".server-item[data-id]")
                if srv_item:
                    srv_id = srv_item.get('data-id')
                    stream_resp = client.get(f"https://anikototv.to/ajax/v2/episode/sources?id={srv_id}")
                    print("Stream Source Response:", stream_resp.json())
