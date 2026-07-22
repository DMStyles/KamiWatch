import httpx
from bs4 import BeautifulSoup
import re

async def webtoons_search(query: str, page: int = 1) -> list:
    url = "https://www.webtoons.com/en/search?keyword=" + query
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")
            results = []
            for item in soup.select("._card_item"):
                title_no = item.get("data-title-no")
                if not title_no: continue
                title = item.select_one(".title").text.strip()
                img = item.select_one("img")
                cover = img.get("src") if img else ""
                href = item.get("href", "")
                
                parts = href.split("?")[0].split("/")
                if len(parts) >= 4:
                    genre = parts[2]
                    slug = parts[3]
                    mid = f"{title_no}|{genre}|{slug}"
                    if not any(r["id"] == f"webtoons:{mid}" for r in results):
                        results.append({
                            "id": f"webtoons:{mid}",
                            "title": title,
                            "cover": cover,
                            "source": "webtoons",
                            "status": "unknown"
                        })
            return results
    except Exception as e:
        print(f"[Webtoons search error] {e}")
        return []

async def webtoons_chapters(manga_id: str) -> list:
    parts = manga_id.split("|")
    if len(parts) != 3: return []
    title_no, genre, slug = parts
    
    # We will fetch page 1 and page 2 (most webtoons have 10 per page)
    # This might not get all chapters, but gets the most recent 20
    chapters = []
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            for page in range(1, 4):
                url = f"https://www.webtoons.com/en/{genre}/{slug}/list?title_no={title_no}&page={page}"
                r = await client.get(url)
                soup = BeautifulSoup(r.text, "html.parser")
                
                items = soup.select("#_listUl li")
                if not items: break
                
                for item in items:
                    link = item.select_one("a")
                    if not link: continue
                    href = link.get("href", "")
                    
                    # Extract episode_no from href
                    ep_no = "?"
                    m = re.search(r'episode_no=(\d+)', href)
                    if m: ep_no = m.group(1)
                    
                    title_el = item.select_one(".subj span")
                    title = title_el.text.strip() if title_el else f"Episode {ep_no}"
                    
                    chapters.append({
                        "id": f"webtoons:{title_no}|{ep_no}|{genre}|{slug}",
                        "number": ep_no,
                        "title": title,
                        "source": "webtoons",
                        "externalUrl": href
                    })
            
            # Sort ascending
            chapters.reverse()
            return chapters
    except Exception as e:
        print(f"[Webtoons chapters error] {e}")
        return []

async def webtoons_pages(chapter_id: str) -> list:
    parts = chapter_id.split("|")
    if len(parts) != 4: return []
    title_no, ep_no, genre, slug = parts
    
    url = f"https://www.webtoons.com/en/{genre}/{slug}/viewer?title_no={title_no}&episode_no={ep_no}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url)
            soup = BeautifulSoup(r.text, "html.parser")
            pages = []
            
            # Images are inside #_imageList
            image_list = soup.select_one("#_imageList")
            if image_list:
                for img in image_list.select("img"):
                    src = img.get("data-url")
                    if src:
                        pages.append(src)
            return pages
    except Exception as e:
        print(f"[Webtoons pages error] {e}")
        return []
