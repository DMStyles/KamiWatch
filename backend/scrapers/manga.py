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
import math
from fastapi.responses import StreamingResponse
from .mangaddict import mangaddict_search, mangaddict_chapters, mangaddict_pages
from .webtoons import webtoons_search, webtoons_chapters, webtoons_pages

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

async def mangadex_search(query: str, page: int = 1) -> dict:
    url = f"{MANGADEX_API}/manga"
    limit = 20
    offset = (page - 1) * limit
    params = {
        "title": query,
        "limit": limit,
        "offset": offset,
        "contentRating[]": ["safe", "suggestive", "erotica"],
        "includes[]": ["cover_art"],
        "order[relevance]": "desc",
    }
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(url, params=params)
            data = r.json()
            total = data.get("total", 0)
            total_pages = math.ceil(total / limit) if total else 1
            results = []
            for item in data.get("data", []):
                mid = item["id"]
                attrs = item.get("attributes", {})
                title = (attrs.get("title") or {}).get("en") or next(iter((attrs.get("title") or {}).values()), "Unknown")
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
            return {"results": results, "totalPages": total_pages, "total": total}
    except Exception as e:
        print(f"[MangaDex search error] {e}")
        return {"results": [], "totalPages": 1, "total": 0}


async def mangadex_chapters(manga_id: str) -> list:
    """Fetch all chapter list from MangaDex, aggregated and sorted."""
    params = {
        "manga": manga_id,
        "translatedLanguage[]": ["en"],
        "order[chapter]": "asc",
        "limit": 100,
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
                        "externalUrl": attrs.get("externalUrl")
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

async def mangakakalot_search(query: str, page: int = 1) -> list:
    q = query.replace(" ", "_").lower()
    url = f"https://mangakakalot.com/search/story/{q}?page={page}"
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
async def search_manga(q: str, source: str = "auto", page: int = 1):
    """Search manga across all sources with pagination."""
    total_pages = 1
    results = []
    if source == "mangadex":
        res = await mangadex_search(q, page=page)
        results = res.get("results", [])
        total_pages = res.get("totalPages", 1)
    elif source == "mangakakalot":
        results = await mangakakalot_search(q, page=page)
        total_pages = 10 if len(results) >= 15 else page
    elif source == "mangaddict":
        results = await mangaddict_search(q, page=page)
        total_pages = 10 if len(results) >= 10 else page
    elif source == "webtoons":
        results = await webtoons_search(q, page=page)
        total_pages = 5 if len(results) >= 10 else page
    else:
        # Auto: try MangaDex first
        res = await mangadex_search(q, page=page)
        results = res.get("results", [])
        total_pages = res.get("totalPages", 1)
        if not results:
            results = await mangakakalot_search(q, page=page)
            total_pages = 10 if len(results) >= 15 else page
        if not results:
            results = await mangaddict_search(q, page=page)
            total_pages = 10 if len(results) >= 10 else page
        if not results:
            results = await webtoons_search(q, page=page)
            total_pages = 5 if len(results) >= 10 else page

    return {"results": results, "query": q, "totalPages": total_pages, "currentPage": page}


def _parse_mdex_items(data: dict) -> list:
    """Shared helper to parse MangaDex manga list responses."""
    results = []
    for item in data.get("data", []):
        attrs = item.get("attributes", {})
        title = (attrs.get("title") or {}).get("en") or next(iter((attrs.get("title") or {}).values()), "Unknown")
        cover_id = None
        for rel in item.get("relationships", []):
            if rel["type"] == "cover_art":
                cover_id = rel.get("attributes", {}).get("fileName")
        cover_url = f"{MANGADEX_IMG}/covers/{item['id']}/{cover_id}.256.jpg" if cover_id else ""
        results.append({
            "id": f"mdex:{item['id']}",
            "title": title,
            "cover": cover_url,
            "source": "mangadex",
            "status": attrs.get("status", "unknown"),
            "year": attrs.get("year"),
            "description": (attrs.get("description") or {}).get("en", "")
        })
    return results


@router.get("/trending")
async def trending_manga():
    """Get top followed/popular manga from MangaDex."""
    params = {
        "limit": 20,
        "contentRating[]": ["safe", "suggestive", "erotica"],
        "includes[]": ["cover_art"],
        "order[followedCount]": "desc",
    }
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(f"{MANGADEX_API}/manga", params=params)
            return {"results": _parse_mdex_items(r.json())}
    except Exception as e:
        print(f"[MangaDex trending error] {e}")
        return {"results": []}


@router.get("/new-releases")
async def new_manga_releases():
    """Get recently added manga from MangaDex."""
    params = {
        "limit": 20,
        "contentRating[]": ["safe", "suggestive", "erotica"],
        "includes[]": ["cover_art"],
        "order[createdAt]": "desc",
    }
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(f"{MANGADEX_API}/manga", params=params)
            return {"results": _parse_mdex_items(r.json())}
    except Exception as e:
        print(f"[MangaDex new-releases error] {e}")
        return {"results": []}


@router.get("/popular-new")
async def popular_new_manga():
    """Get recently updated/popular manga from MangaDex."""
    params = {
        "limit": 20,
        "contentRating[]": ["safe", "suggestive", "erotica"],
        "includes[]": ["cover_art"],
        "order[latestUploadedChapter]": "desc",
    }
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(f"{MANGADEX_API}/manga", params=params)
            return {"results": _parse_mdex_items(r.json())}
    except Exception as e:
        print(f"[MangaDex popular-new error] {e}")
        return {"results": []}

@router.get("/genre")
async def browse_genre(genre_id: str = None, demographic: str = None, page: int = 1):
    """Browse MangaDex by genre tag or demographic with pagination."""
    url = f"{MANGADEX_API}/manga"
    limit = 20
    offset = (page - 1) * limit
    params = {
        "limit": limit,
        "offset": offset,
        "contentRating[]": ["safe", "suggestive", "erotica"],
        "includes[]": ["cover_art"],
        "order[relevance]": "desc",
    }
    if genre_id:
        params["includedTags[]"] = [genre_id]
    if demographic:
        params["publicationDemographic[]"] = [demographic]
        
    try:
        async with httpx.AsyncClient(timeout=15, headers=MANGADEX_HEADERS) as client:
            r = await client.get(url, params=params)
            data = r.json()
            total = data.get("total", 0)
            total_pages = math.ceil(total / limit) if total else 1
            results = []
            for item in data.get("data", []):
                attrs = item.get("attributes", {})
                title = (attrs.get("title") or {}).get("en") or next(iter((attrs.get("title") or {}).values()), "Unknown")
                
                cover_id = None
                for rel in item.get("relationships", []):
                    if rel["type"] == "cover_art":
                        cover_id = rel.get("attributes", {}).get("fileName")
                
                cover_url = f"{MANGADEX_IMG}/covers/{item['id']}/{cover_id}.256.jpg" if cover_id else ""

                results.append({
                    "id": f"mdex:{item['id']}",
                    "title": title,
                    "cover": cover_url,
                    "source": "mangadex",
                    "status": attrs.get("status", "unknown"),
                    "year": attrs.get("year"),
                    "description": (attrs.get("description") or {}).get("en", "")
                })
            return {"results": results, "genre_id": genre_id, "totalPages": total_pages, "currentPage": page}
    except Exception as e:
        print(f"[MangaDex genre error] {e}")
        return {"results": [], "totalPages": 1, "currentPage": 1}


@router.get("/chapters")
async def get_chapters(id: str):
    """Fetch chapter list. id = 'mdex:<uuid>' or 'kakalot:<url>'"""
    if id.startswith("mdex:"):
        manga_id = id[5:]
        chapters = await mangadex_chapters(manga_id)
    elif id.startswith("kakalot:"):
        url = id[8:]
        chapters = await mangakakalot_chapters(url)
    elif id.startswith("mangaddict:"):
        slug = id[11:]
        chapters = await mangaddict_chapters(slug)
    elif id.startswith("webtoons:"):
        mid = id[9:]
        chapters = await webtoons_chapters(mid)
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
    elif id.startswith("mangaddict:"):
        ch_id = id[11:]
        pages = await mangaddict_pages(ch_id)
    elif id.startswith("webtoons:"):
        ch_id = id[9:]
        pages = await webtoons_pages(ch_id)
    else:
        pages = []

    # Proxy all pages through local backend to prevent CORS/Referer block on Electron
    proxied_pages = [f"/manga/proxy?url={httpx.URL(p)}" for p in pages if p]
    return {"pages": proxied_pages, "total": len(proxied_pages)}


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

@router.get("/proxy")
async def proxy_image(url: str):
    """Proxy image requests to bypass Referer/CORS restrictions across all sources."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    if "webtoons.com" in url:
        headers["Referer"] = "https://www.webtoons.com/"
    elif "mangadex" in url:
        headers["Referer"] = "https://mangadex.org/"
    elif "mangakakalot" in url or "manganelo" in url:
        headers["Referer"] = "https://mangakakalot.com/"
    elif "mangaddict" in url:
        headers["Referer"] = "https://www.mangaddict.com/"
    
    client = httpx.AsyncClient(timeout=20, follow_redirects=True)
    
    async def generate():
        try:
            async with client.stream("GET", url, headers=headers) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk
        except Exception as e:
            print(f"[Proxy error] {e}")
                
    return StreamingResponse(generate(), media_type="image/jpeg")
