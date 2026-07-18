import httpx
from fastapi import APIRouter
from bs4 import BeautifulSoup
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import DynamicBaseURL
from client import SharedClientContext

# Monkey-patch httpx.AsyncClient to enable connection pooling
httpx.AsyncClient = SharedClientContext

router = APIRouter()

BASE_URL = DynamicBaseURL("animetake_domain", "https://animetake.tv")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

@router.get("/search")
async def search_animetake(q: str):
    url = f"{BASE_URL}/animelist/?search={q}"
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    results = []
    for item in soup.select(".anime-list-item")[:20]:
        a = item.select_one("a[href]")
        img = item.select_one("img")
        name = item.select_one(".anime-title")
        type_el = item.select_one(".anime-type")
        if a and name:
            results.append({
                "title": name.get_text(strip=True),
                "url": a["href"] if a["href"].startswith("http") else BASE_URL + a["href"],
                "thumbnail": img["src"] if img else "",
                "sub_episodes": "?",
                "dub_episodes": "0",
                "type": type_el.get_text(strip=True) if type_el else "TV",
                "source": "animetake",
            })
    return {"results": results, "source": "animetake"}


@router.get("/episodes")
async def get_episodes(url: str):
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    title_el = soup.select_one("h1.anime-title, .entry-title")
    title = title_el.get_text(strip=True) if title_el else "Unknown"
    thumb_el = soup.select_one(".anime-cover img, .entry-content img")
    thumbnail = thumb_el.get("src", "") if thumb_el else ""
    episodes = []
    for ep in soup.select(".episode-list a, .episodes-list a"):
        ep_text = ep.get_text(strip=True)
        ep_href = ep.get("href", "")
        episodes.append({
            "number": ep_text,
            "title": ep_text,
            "url": ep_href if ep_href.startswith("http") else BASE_URL + ep_href,
        })
    return {"title": title, "thumbnail": thumbnail, "episodes": episodes, "source": "animetake"}
