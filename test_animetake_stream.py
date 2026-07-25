import urllib.request
from bs4 import BeautifulSoup
import re

url = "https://animetake.tv/search/?search=Trapped+in+a+Dating+Sim"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://animetake.tv/'
}

try:
    req = urllib.request.Request(url, headers=headers)
    html = urllib.request.urlopen(req).read().decode('utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    for item in soup.select('.component-animelist'):
        a = item.select_one('.animeposter a[href]')
        name = item.select_one('.animename')
        print("Show Found:", name.text if name else '', a['href'] if a else '')
        
        # Test watch page
        show_url = a['href'] if a['href'].startswith('http') else 'https://animetake.tv' + a['href']
        show_html = urllib.request.urlopen(urllib.request.Request(show_url, headers=headers)).read().decode('utf-8')
        show_soup = BeautifulSoup(show_html, 'html.parser')
        ep_a = show_soup.select_one("a[href*='/watch/']")
        if ep_a:
            ep_url = ep_a['href'] if ep_a['href'].startswith('http') else 'https://animetake.tv' + ep_a['href']
            print("Ep Watch URL:", ep_url)
            ep_html = urllib.request.urlopen(urllib.request.Request(ep_url, headers=headers)).read().decode('utf-8')
            ep_soup = BeautifulSoup(ep_html, 'html.parser')
            print("Embed iframes:", [iframes['src'] for iframes in ep_soup.select('iframe[src]')])
            print("Video sources:", [v['src'] for v in ep_soup.select('video source[src]')])
            print("All iframes:", [iframes.get('src', '') for iframes in ep_soup.find_all('iframe')])
            print("Scripts:", [s.text[:100] for s in ep_soup.find_all('script') if 'file' in s.text or 'player' in s.text or 'src' in s.text or 'iframe' in s.text][:5])
        break
except Exception as e:
    print("Error:", e)
