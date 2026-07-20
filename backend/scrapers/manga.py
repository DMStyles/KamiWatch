"""
KamiWatch Manga Scraper
Sources:
  - MangaDex (Primary, official API - no scraping needed)
  - MangaKakalot (Backup, free scrape)
  - FanFox/MangaFox (Backup, free scrape)
"""

import httpx
from fastapi import APIRouter
from bs4 import BeautifulSoup
import asyncio
import re

router = APIRouter()

MANGADEX_API = "https://api.mangadex.org"
MANGADEX_IMG = "https://uploads.mangadex.org"

MANGADEX_HEADERS = {
    "User-Agent": "KamiWatch/2.0.0",
    "Accept": "application/json",
}

# =============================================
# MangaDex Source (Primary – official free API)
# =============================================

async def mangadex_search(query: str) -> list:
    url = f"{MANGADEX_API}/manga"
    params = {
        "title": query,
        "limit": 20,
        "contentRating[]": ["safe", "suggestive", "erotica"],
        "includes[]": ["cover_art"],
        "order[relevance]": "desc",
    }
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(url, params=params)
            data = r.json()
            results = []
            for item in data.get("data", []):
                mid = item["id"]
                attrs = item.get("attributes", {})
                title = (attrs.get("title") or {}).get("en") or next(iter((attrs.get("title") or {}).values()), "Unknown")
                # Get cover
                cover_rel = next((r for r in item.get("relationships", []) if r["type"] == "cover_art"), None)
                cover = ""
                if cover_rel:
                    fname = cover_rel.get("attributes", {}).get("fileName", "")
                    cover = f"{MANGADEX_IMG}/covers/{mid}/{fname}.256.jpg"
                results.append({
                    "id": f"mdex:{mid}",
                    "title": title,
                    "cover": cover,
                    "source": "mangadex",
                    "status": attrs.get("status", ""),
                    "year": attrs.get("year"),
                    "description": (attrs.get("description") or {}).get("en", ""),
                })
            return results
    except Exception as e:
        print(f"[MangaDex search error] {e}")
        return []


async def mangadex_chapters(manga_id: str) -> list:
    """Fetch all chapter list from MangaDex, aggregated and sorted."""
    params = {
        "manga": manga_id,
        "translatedLanguage[]": ["en"],
        "order[chapter]": "asc",
        "limit": 500,
        "includes[]": ["scanlation_group"],
        "contentRating[]": ["safe", "suggestive", "erotica"],
    }
    try:
        async with httpx.AsyncClient(timeout=20, headers=MANGADEX_HEADERS) as client:
            chapters = []
            offset = 0
            while True:
                params["offset"] = offset
                r = await client.get(f"{MANGADEX_API}/chapter", params=params)
                data = r.json()
                batch = data.get("data", [])
                if not batch:
                    break
                for ch in batch:
                    attrs = ch.get("attributes", {})
                    ch_num = attrs.get("chapter") or "?"
                    ch_title = attrs.get("title") or f"Chapter {ch_num}"
                    chapters.append({
                        "id": f"mdex:{ch['id']}",
                        "number": ch_num,
                        "title": ch_title,
                        "pages": attrs.get("pages", 0),
                        "publishAt": attrs.get("publishAt", ""),
                        "source": "mangadex",
                    })
                total = data.get("total", 0)
                offset += len(batch)
                if offset >= total:
                    break
                await asyncio.sleep(0.3)  # rate limit
            return chapters
    except Exception as e:
        print(f"[MangaDex chapters error] {e}")
        return []


async def mangadex_pages(chapter_id: str) -> list:
    """Get page image URLs for a MangaDex chapter."""
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(f"{MANGADEX_API}/at-home/server/{chapter_id}")
            data = r.json()
            base = data.get("baseUrl", MANGADEX_IMG)
            ch = data.get("chapter", {})
            hash_ = ch.get("hash", "")
            files = ch.get("data", [])
            return [f"{base}/data/{hash_}/{f}" for f in files]
    except Exception as e:
        print(f"[MangaDex pages error] {e}")
        return []


# =============================================
# MangaKakalot Source (Backup)
# =============================================

async def mangakakalot_search(query: str) -> list:
    q = query.replace(" ", "_").lower()
    url = f"https://mangakakalot.com/search/story/{q}"
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers={
            "User-Agent": HEADERS["User-Agent"],
        }) as client:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")
            results = []
            for item in soup.select(".story_item")[:15]:
                a = item.select_one("h3.story_name a") or item.select_one(".story_name a")
                img = item.select_one("img")
                if not a:
                    continue
                results.append({
                    "id": f"kakalot:{a['href']}",
                    "title": a.get_text(strip=True),
                    "cover": img["src"] if img else "",
                    "source": "mangakakalot",
                    "status": "",
                    "year": None,
                    "description": "",
                })
            return results
    except Exception as e:
        print(f"[Mangakakalot search error] {e}")
        return []


async def mangakakalot_chapters(url: str) -> list:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers={
            "User-Agent": HEADERS["User-Agent"],
        }) as client:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")
            chapters = []
            for row in soup.select(".chapter-list .row"):
                a = row.select_one("a")
                if not a:
                    continue
                title = a.get_text(strip=True)
                ch_url = a["href"]
                num_match = re.search(r"chapter[_\-](\d+(?:\.\d+)?)", ch_url, re.I)
                num = num_match.group(1) if num_match else title
                chapters.append({
                    "id": f"kakalot:{ch_url}",
                    "number": num,
                    "title": title,
                    "pages": 0,
                    "source": "mangakakalot",
                })
            chapters.reverse()  # oldest first
            return chapters
    except Exception as e:
        print(f"[Mangakakalot chapters error] {e}")
        return []


async def mangakakalot_pages(chapter_url: str) -> list:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers={
            "User-Agent": HEADERS["User-Agent"],
            "Referer": "https://mangakakalot.com/",
        }) as client:
            r = await client.get(chapter_url)
            soup = BeautifulSoup(r.text, "html.parser")
            imgs = soup.select(".container-chapter-reader img")
            return [img.get("src") or img.get("data-src") for img in imgs if img.get("src") or img.get("data-src")]
    except Exception as e:
        print(f"[Mangakakalot pages error] {e}")
        return []


# =============================================
# API Routes
# =============================================

@router.get("/search")
async def search_manga(q: str, source: str = "auto"):
    """Search manga across all sources."""
    if source == "mangadex":
        results = await mangadex_search(q)
    elif source == "mangakakalot":
        results = await mangakakalot_search(q)
    else:
        # Auto: try MangaDex first (best quality), fallback to Mangakakalot
        results = await mangadex_search(q)
        if not results:
            results = await mangakakalot_search(q)

    return {"results": results, "query": q}


@router.get("/chapters")
async def get_chapters(id: str):
    """Fetch chapter list. id = 'mdex:<uuid>' or 'kakalot:<url>'"""
    if id.startswith("mdex:"):
        manga_id = id[5:]
        chapters = await mangadex_chapters(manga_id)
    elif id.startswith("kakalot:"):
        url = id[8:]
        chapters = await mangakakalot_chapters(url)
    else:
        # Try as raw MangaDex UUID
        chapters = await mangadex_chapters(id)

    return {"chapters": chapters, "total": len(chapters)}


@router.get("/pages")
async def get_pages(id: str):
    """Fetch page image URLs for a chapter. id = 'mdex:<chapter_uuid>' or 'kakalot:<url>'"""
    if id.startswith("mdex:"):
        chapter_id = id[5:]
        pages = await mangadex_pages(chapter_id)
    elif id.startswith("kakalot:"):
        url = id[8:]
        pages = await mangakakalot_pages(url)
    else:
        pages = []

    return {"pages": pages, "total": len(pages)}


@router.get("/details")
async def get_manga_details(id: str):
    """Fetch detailed metadata for a manga."""
    if id.startswith("mdex:"):
        manga_id = id[5:]
        params = {
            "includes[]": ["cover_art", "author", "artist"],
        }
        try:
            async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
                r = await client.get(f"{MANGADEX_API}/manga/{manga_id}", params=params)
                data = r.json().get("data", {})
                attrs = data.get("attributes", {})
                mid = data["id"]
                title = (attrs.get("title") or {}).get("en") or next(iter((attrs.get("title") or {}).values()), "Unknown")
                desc = (attrs.get("description") or {}).get("en", "")
                cover_rel = next((r for r in data.get("relationships", []) if r["type"] == "cover_art"), None)
                cover = ""
                if cover_rel:
                    fname = cover_rel.get("attributes", {}).get("fileName", "")
                    cover = f"{MANGADEX_IMG}/covers/{mid}/{fname}.512.jpg"
                author_rel = next((r for r in data.get("relationships", []) if r["type"] == "author"), None)
                author = (author_rel.get("attributes") or {}).get("name", "") if author_rel else ""
                genres = [tag["attributes"]["name"].get("en", "") for tag in attrs.get("tags", []) if tag.get("attributes")]
                return {
                    "id": f"mdex:{mid}",
                    "title": title,
                    "cover": cover,
                    "description": desc,
                    "status": attrs.get("status", ""),
                    "year": attrs.get("year"),
                    "author": author,
                    "genres": genres,
                    "source": "mangadex",
                }
        except Exception as e:
            return {"error": str(e)}
    return {"error": "Unknown manga source"}
