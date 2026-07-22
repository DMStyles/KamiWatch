import httpx
from bs4 import BeautifulSoup
import re

async def mangaddict_search(query: str, page: int = 1) -> list:
    url = f"https://www.mangaddict.com/en/page/{page}/" if page > 1 else "https://www.mangaddict.com/en/"
    params = {"s": query, "lang": "en"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, params=params)
            soup = BeautifulSoup(r.text, "html.parser")
            results = []
            
            for article in soup.select("article.chapter-item"):
                classes = article.get("class", [])
                category = next((c for c in classes if c.startswith("category-")), None)
                if not category:
                    continue
                slug = category.replace("category-", "")
                
                ch_title_el = article.select_one(".chapter-title")
                if not ch_title_el:
                    continue
                
                ch_title = ch_title_el.text.strip()
                title = ch_title.split(", Chapter")[0].strip()
                
                if not any(r["id"] == f"mangaddict:{slug}" for r in results):
                    results.append({
                        "id": f"mangaddict:{slug}",
                        "title": title,
                        "cover": "https://via.placeholder.com/200x280?text=MangaDict",
                        "source": "mangaddict",
                        "status": "unknown"
                    })
            return results
    except Exception as e:
        print(f"[MangaDict search error] {e}")
        return []

async def mangaddict_chapters(slug: str) -> list:
    url = f"https://www.mangaddict.com/en/manga/{slug}.html"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")
            chapters = []
            
            # Try to get better cover
            cover_el = soup.select_one(".series-header-thumbnail img")
            cover = cover_el.get("src") if cover_el else ""
            
            for article in soup.select("article.chapter-item"):
                link = article.select_one("a.chapter-link")
                if not link:
                    continue
                href = link.get("href", "")
                ch_slug = href.split("/")[-1].replace(".html", "")
                
                ch_title_el = article.select_one(".chapter-title")
                title = ch_title_el.text.strip() if ch_title_el else ch_slug
                
                # extract chapter number
                num = "?"
                m = re.search(r'Chapter ([\d\.]+)', title, re.IGNORECASE)
                if m:
                    num = m.group(1)
                else:
                    m = re.search(r'chapter-([\d\.]+)', ch_slug, re.IGNORECASE)
                    if m:
                        num = m.group(1)
                
                chapters.append({
                    "id": f"mangaddict:{slug}|{ch_slug}",
                    "number": num,
                    "title": title,
                    "source": "mangaddict",
                    "externalUrl": href
                })
            
            # Newest first sorting is default on HTML, reverse for ascending
            chapters.reverse()
            return chapters
    except Exception as e:
        print(f"[MangaDict chapters error] {e}")
        return []

async def mangaddict_pages(chapter_id: str) -> list:
    # chapter_id format: slug|ch_slug
    parts = chapter_id.split("|")
    if len(parts) != 2: return []
    slug, ch_slug = parts
    
    url = f"https://www.mangaddict.com/en/{slug}/{ch_slug}.html"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")
            pages = []
            
            # Images are inside wp-block-image
            for img in soup.select("figure.wp-block-image img"):
                src = img.get("data-src") or img.get("src")
                if src and not src.startswith("data:"):
                    pages.append(src)
            return pages
    except Exception as e:
        print(f"[MangaDict pages error] {e}")
        return []
