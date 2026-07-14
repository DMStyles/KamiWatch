import httpx
from bs4 import BeautifulSoup

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# Test Anikoto search
q = "Grand Blue S3"
url_anikoto = f"https://anikototv.to/filter?keyword={q}"
resp = httpx.get(url_anikoto, headers=headers)
print("Anikoto Search Status:", resp.status_code)
soup = BeautifulSoup(resp.text, "html.parser")
items = soup.select(".ani.items .item")
print("Anikoto results count:", len(items))
for item in items[:3]:
    name = item.select_one(".name")
    print("  -", name.text.strip() if name else "None")

# Test AnimeTake search
url_animetake = f"https://animetake.tv/animelist/?search={q}"
resp_take = httpx.get(url_animetake, headers=headers)
print("\nAnimeTake Search Status:", resp_take.status_code)
soup_take = BeautifulSoup(resp_take.text, "html.parser")
items_take = soup_take.select(".anime-list-item")
print("AnimeTake results count:", len(items_take))
for item in items_take[:3]:
    name = item.select_one(".anime-title")
    print("  -", name.text.strip() if name else "None")
