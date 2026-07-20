import httpx
import base64
import urllib.parse
from fastapi import APIRouter
from bs4 import BeautifulSoup
from typing import Optional
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import DynamicBaseURL
from client import SharedClientContext

# Monkey-patch httpx.AsyncClient to enable connection pooling
httpx.AsyncClient = SharedClientContext

router = APIRouter()

BASE_URL = DynamicBaseURL("anikoto_domain", "https://anikototv.to")
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
    
    title_el = soup.select_one(".anisc-detail .film-name, h1.title.d-title, h1.d-title, h1")
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
async def resolve_stream(data_ids: str, sub_dub: str = "sub", server: Optional[str] = None):
    server_list_url = f"{BASE_URL}/ajax/server/list?servers={data_ids}"
    headers = {"User-Agent": HEADERS["User-Agent"], "X-Requested-With": "XMLHttpRequest"}
    probe_headers = {"User-Agent": HEADERS["User-Agent"], "Referer": BASE_URL + "/"}
    
    async with httpx.AsyncClient(headers=headers, timeout=15) as client:
        resp = await client.get(server_list_url)
    
    if resp.status_code != 200:
        return {"error": "Failed to fetch server list"}
        
    data = resp.json()
    html = data.get("result", "")
    soup = BeautifulSoup(html, "html.parser")
    
    target_type = "dub" if sub_dub == "dub" else "sub"
    type_block = soup.select_one(f'.servers .type[data-type="{target_type}"]')
    if not type_block:
        type_block = soup.select_one(".servers .type")
    
    if not type_block:
        return {"error": "No servers found"}
    
    candidates = type_block.select("li[data-link-id]")
    if not candidates:
        return {"error": "No servers found"}

    # Step 1: Resolve servers sequentially to avoid triggering rate-limits
    valid_servers = []
    async with httpx.AsyncClient(headers=headers, timeout=10) as client:
        for c in candidates:
            link_id = c.get("data-link-id")
            name = c.text.strip()
            source_url = f"{BASE_URL}/ajax/server?get={link_id}"
            try:
                r = await client.get(source_url)
                if r.status_code == 200:
                    url = r.json().get("result", {}).get("url")
                    if url:
                        valid_servers.append({"name": name, "url": url})
            except:
                pass

    if not valid_servers:
        return {"error": "Failed to resolve any servers"}

    # Step 2: Probe Megaplay servers for the 410 Error by checking the actual HTML
    alive_servers = []
    async with httpx.AsyncClient(headers=probe_headers, timeout=8, follow_redirects=True) as client:
        for srv in valid_servers:
            is_alive = True
            if "megaplay" in srv["url"] or "vidwish" in srv["url"]:
                try:
                    r = await client.get(srv["url"])
                    if "Error Code: 410" in r.text or "deleted" in r.text.lower():
                        is_alive = False
                except:
                    pass
            
            if is_alive:
                alive_servers.append(srv)

    server_pool = alive_servers if alive_servers else valid_servers

    # Step 3: Choose server based on requested server name, otherwise auto fallback
    preferred = server_pool[0]
    if server and server != "auto":
        for srv in valid_servers: # Check all valid_servers if user requested explicit server
            if server.lower() in srv["name"].lower():
                preferred = srv
                break
    else:
        for pref_name in ["HD-1", "Vidstream-2", "VidCloud-1"]:
            for srv in server_pool:
                if pref_name.lower() in srv["name"].lower():
                    preferred = srv
                    break
            else:
                continue
            break

    return {
        "url": preferred["url"],
        "name": preferred["name"],
        "alternatives": valid_servers
    }


import asyncio

@router.get("/latest")
async def get_latest_episodes(limit: int = 24):
    headers = {"User-Agent": HEADERS["User-Agent"]}
    try:
        if limit <= 24:
            url = f"{BASE_URL}/home"
            async with httpx.AsyncClient(headers=headers, timeout=15) as client:
                resp = await client.get(url)
            if resp.status_code != 200:
                return {"results": [], "error": f"HTTP {resp.status_code}"}
                
            soup = BeautifulSoup(resp.text, "html.parser")
            
            latest_block = None
            for block in soup.select(".block, section, .section"):
                heading_el = block.select_one("h2, h3, .heading, .title")
                if heading_el and "latest episode" in heading_el.text.lower():
                    latest_block = block
                    break
                    
            items_source = latest_block if latest_block else soup
            results = []
            for item in items_source.select(".ani.items .item")[:limit]:
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
        else:
            # Concurrently fetch pages to get up to 100 items (30 items per page)
            pages_to_fetch = (limit + 29) // 30
            results = []
            
            async with httpx.AsyncClient(headers=headers, timeout=15) as client:
                tasks = [
                    client.get(f"{BASE_URL}/filter?sort=recently_updated&page={page}", follow_redirects=True)
                    for page in range(1, pages_to_fetch + 1)
                ]
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                
                for resp in responses:
                    if isinstance(resp, Exception) or resp.status_code != 200:
                        continue
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for item in soup.select(".ani.items .item"):
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
            return {"results": results[:limit], "source": "anikoto"}
    except Exception as e:
        return {"results": [], "error": str(e)}


@router.get("/upcoming")
async def get_upcoming_anime():
    url = f"{BASE_URL}/home"
    headers = {"User-Agent": HEADERS["User-Agent"]}
    try:
        async with httpx.AsyncClient(headers=headers, timeout=15) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            return {"results": [], "error": f"HTTP {resp.status_code}"}
            
        soup = BeautifulSoup(resp.text, "html.parser")
        
        upcoming_block = None
        for block in soup.select(".block, section, .section"):
            heading_el = block.select_one("h2, h3, .heading, .title")
            if heading_el and "upcoming anime" in heading_el.text.lower():
                upcoming_block = block
                break
                
        items_source = upcoming_block if upcoming_block else soup
        results = []
        for item in items_source.select(".ani.items .item")[:24]:
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

