import httpx
from fastapi import APIRouter
from bs4 import BeautifulSoup
import re
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import DynamicBaseURL

router = APIRouter()

BASE_URL = DynamicBaseURL("kissanime_domain", "https://kissanime.com.vc")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

@router.get("/search")
async def search_kissanime(q: str):
    url = f"{BASE_URL}/?s={q}"
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
        resp = await client.get(url)
    
    soup = BeautifulSoup(resp.text, "html.parser")
    results = []
    
    items = soup.select(".item, .video-block, .film-detail, article, .post")
    for item in items[:20]:
        a = item.select_one("a")
        title_el = item.select_one("h2, h3, .title, .name")
        img_el = item.select_one("img")
        
        if a:
            title = title_el.text.strip() if title_el else a.text.strip()
            href = a.get("href")
            if not href.startswith("http"):
                href = BASE_URL + href
                
            img = img_el.get("src") if img_el else ""
            
            if title and href:
                results.append({
                    "title": title,
                    "url": href,
                    "thumbnail": img,
                    "sub_episodes": "?",
                    "dub_episodes": "0",
                    "type": "TV",
                    "source": "kissanime",
                })
                
    return {"results": results, "source": "kissanime"}


@router.get("/episodes")
async def get_episodes(url: str):
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
        resp = await client.get(url)
    
    soup = BeautifulSoup(resp.text, "html.parser")
    title_el = soup.select_one("h1, h2.title, .entry-title")
    title = title_el.get_text(strip=True) if title_el else "Unknown"
    
    thumb_el = soup.select_one(".anime-poster img, .entry-content img, .post-thumbnail img")
    thumbnail = thumb_el.get("src", "") if thumb_el else ""
    
    episodes = []
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        text = a.text.strip()
        if re.search(r'\d', text) or "ep" in text.lower() or "ep" in href.lower():
            # Check if it looks like an episode link (usually contains 'episode')
            if "episode" in href.lower() or "episode" in text.lower() or re.match(r'^\d+$', text):
                # Avoid duplicates
                if not any(e["url"] == href for e in episodes):
                    # Kissanime usually lists from Ep 1 to Ep N, but sometimes reverse.
                    # We will just parse the text as number if possible
                    num_match = re.search(r'\d+', text)
                    num = num_match.group(0) if num_match else text
                    
                    if num.isdigit() and len(num) < 4:  # Avoid matching years
                        episodes.append({
                            "number": num,
                            "title": text if "episode" in text.lower() else f"Episode {num}",
                            "url": href,
                        })
                        
    # Sort episodes by number if possible
    try:
        episodes.sort(key=lambda x: int(x["number"]))
    except:
        pass
        
    return {"title": title, "thumbnail": thumbnail, "episodes": episodes, "source": "kissanime"}


@router.get("/resolve")
async def resolve_stream(url: str):
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
        resp = await client.get(url)
        
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Kissanime uses iframes to embed the stream
    iframe = soup.select_one("iframe")
    if iframe and iframe.get("src"):
        embed_url = iframe.get("src")
        if embed_url.startswith("//"):
            embed_url = "https:" + embed_url
        return {"url": embed_url}
        
    return {"error": "Stream not found"}
