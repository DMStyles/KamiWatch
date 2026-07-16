import httpx
import base64
import urllib.parse
from fastapi import APIRouter
from bs4 import BeautifulSoup
from typing import Optional

router = APIRouter()

BASE_URL = "https://anikototv.to"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "X-Requested-With": "XMLHttpRequest"
}

def rc4(key: str, data: str) -> str:
    s = list(range(256))
    j = 0
    for i in range(256):
        j = (j + s[i] + ord(key[i % len(key)])) % 256
        s[i], s[j] = s[j], s[i]
    
    i = j = 0
    out = []
    for char in data:
        i = (i + 1) % 256
        j = (j + s[i]) % 256
        s[i], s[j] = s[j], s[i]
        out.append(chr(ord(char) ^ s[(s[i] + s[j]) % 256]))
    return "".join(out)

def generate_vrf(text: str) -> str:
    encrypted = rc4("simple-hash", text)
    return base64.b64encode(encrypted.encode('latin1')).decode('utf-8')

@router.get("/search")
async def search_anikoto(q: str):
    url = f"{BASE_URL}/filter?keyword={q}"
    headers = {"User-Agent": HEADERS["User-Agent"]}
    async with httpx.AsyncClient(headers=headers, timeout=15) as client:
        resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    results = []
    for item in soup.select(".ani.items .item")[:20]:
        a = item.select_one("a[href]")
        img = item.select_one("img")
        name = item.select_one(".name")
        sub_ep = item.select_one(".ep-status.sub span")
        dub_ep = item.select_one(".ep-status.dub span")
        type_el = item.select_one(".meta .right")
        if a and name:
            results.append({
                "title": name.get_text(strip=True),
                "url": BASE_URL + a["href"] if a["href"].startswith("/") else a["href"],
                "thumbnail": img["src"] if img else "",
                "sub_episodes": sub_ep.get_text(strip=True) if sub_ep else "0",
                "dub_episodes": dub_ep.get_text(strip=True) if dub_ep else "0",
                "type": type_el.get_text(strip=True) if type_el else "TV",
                "source": "anikoto",
            })
    return {"results": results, "source": "anikoto"}


@router.get("/episodes")
async def get_episodes(url: str):
    headers = {"User-Agent": HEADERS["User-Agent"]}
    async with httpx.AsyncClient(headers=headers, timeout=15) as client:
        resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    
    title_el = soup.select_one(".anisc-detail .film-name")
    title = title_el.get_text(strip=True) if title_el else "Unknown"
    thumb_el = soup.select_one(".film-poster img")
    thumbnail = thumb_el.get("src", "") if thumb_el else ""
    
    watch_main = soup.select_one("#watch-main, [data-id]")
    if not watch_main:
        return {"title": title, "thumbnail": thumbnail, "episodes": [], "source": "anikoto"}
        
    show_id = watch_main.get("data-id")
    if not show_id:
        return {"title": title, "thumbnail": thumbnail, "episodes": [], "source": "anikoto"}
        
    vrf = generate_vrf(show_id)
    ajax_url = f"{BASE_URL}/ajax/episode/list/{show_id}?vrf={urllib.parse.quote(vrf)}"
    
    ajax_headers = {
        "User-Agent": HEADERS["User-Agent"],
        "Referer": url,
        "X-Requested-With": "XMLHttpRequest"
    }
    
    async with httpx.AsyncClient(headers=ajax_headers, timeout=15) as client:
        ajax_resp = await client.get(ajax_url)
    
    episodes = []
    if ajax_resp.status_code == 200:
        ajax_data = ajax_resp.json()
        ajax_html = ajax_data.get("result", "")
        ajax_soup = BeautifulSoup(ajax_html, "html.parser")
        
        for ep in ajax_soup.select("a[data-ids]"):
            ep_num = ep.get("data-num", "?")
            data_ids = ep.get("data-ids", "")
            episodes.append({
                "number": ep_num,
                "title": f"Episode {ep_num}",
                "url": f"anikoto:{data_ids}",
            })
            
    return {"title": title, "thumbnail": thumbnail, "episodes": episodes, "source": "anikoto"}

@router.get("/resolve")
async def resolve_stream(data_ids: str):
    server_list_url = f"{BASE_URL}/ajax/server/list?servers={data_ids}"
    headers = {"User-Agent": HEADERS["User-Agent"], "X-Requested-With": "XMLHttpRequest"}
    
    async with httpx.AsyncClient(headers=headers, timeout=15) as client:
        resp = await client.get(server_list_url)
    
    if resp.status_code != 200:
        return {"error": "Failed to fetch server list"}
        
    data = resp.json()
    html = data.get("result", "")
    soup = BeautifulSoup(html, "html.parser")
    
    # Just grab the first server link-id
    li = soup.select_one(".servers li[data-link-id]")
    if not li:
        return {"error": "No servers found"}
        
    link_id = li.get("data-link-id")
    source_url = f"{BASE_URL}/ajax/server?get={link_id}"
    
    async with httpx.AsyncClient(headers=headers, timeout=15) as client:
        resp2 = await client.get(source_url)
        
    if resp2.status_code != 200:
        return {"error": "Failed to resolve server"}
        
    res_data = resp2.json()
    embed_url = res_data.get("result", {}).get("url")
    return {"url": embed_url}


@router.get("/latest")
async def get_latest_episodes():
    url = f"{BASE_URL}/home"
    headers = {"User-Agent": HEADERS["User-Agent"]}
    try:
        async with httpx.AsyncClient(headers=headers, timeout=15) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            return {"results": [], "error": f"HTTP {resp.status_code}"}
            
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for item in soup.select(".ani.items .item")[:24]:
            a = item.select_one("a[href]")
            img = item.select_one("img")
            name = item.select_one(".name")
            sub_ep = item.select_one(".ep-status.sub span")
            dub_ep = item.select_one(".ep-status.dub span")
            type_el = item.select_one(".meta .right")
            if a and name:
                results.append({
                    "title": name.get_text(strip=True),
                    "url": BASE_URL + a["href"] if a["href"].startswith("/") else a["href"],
                    "thumbnail": img["src"] if img else "",
                    "sub_episodes": sub_ep.get_text(strip=True) if sub_ep else "0",
                    "dub_episodes": dub_ep.get_text(strip=True) if dub_ep else "0",
                    "type": type_el.get_text(strip=True) if type_el else "TV",
                    "source": "anikoto",
                })
        return {"results": results, "source": "anikoto"}
    except Exception as e:
        return {"results": [], "error": str(e)}

