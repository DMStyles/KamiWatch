import httpx
from fastapi import APIRouter
from bs4 import BeautifulSoup
from typing import Optional

router = APIRouter()

BASE_URL = "https://anikototv.to"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

@router.get("/search")
async def search_anikoto(q: str):
    url = f"{BASE_URL}/filter?keyword={q}"
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
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
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    episodes = []
    title_el = soup.select_one(".anisc-detail .film-name")
    title = title_el.get_text(strip=True) if title_el else "Unknown"
    thumb_el = soup.select_one(".film-poster img")
    thumbnail = thumb_el.get("src", "") if thumb_el else ""
    ep_list = soup.select("#episodes-content .ep-item")
    for ep in ep_list:
        ep_num = ep.get("data-number", "?")
        ep_title = ep.get("title", f"Episode {ep_num}")
        ep_href = ep.get("href", "")
        episodes.append({
            "number": ep_num,
            "title": ep_title,
            "url": BASE_URL + ep_href if ep_href.startswith("/") else ep_href,
        })
    return {"title": title, "thumbnail": thumbnail, "episodes": episodes, "source": "anikoto"}
