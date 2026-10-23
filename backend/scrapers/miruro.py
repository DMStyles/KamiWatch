import httpx
import re
from fastapi import APIRouter
from typing import Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from client import SharedClientContext

# Monkey-patch httpx.AsyncClient to enable connection pooling
httpx.AsyncClient = SharedClientContext

router = APIRouter()

MIRURO_DOMAINS = [
    "https://www.miruro.to",
    "https://miruro.tv",
    "https://miruro.cx",
    "https://miruro.bz"
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*"
}

ANILIST_GRAPHQL_URL = "https://graphql.anilist.co"

ANILIST_SEARCH_QUERY = """
query ($search: String) {
  Page (page: 1, perPage: 12) {
    media (search: $search, type: ANIME) {
      id
      title {
        english
        romaji
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      episodes
      nextAiringEpisode {
        episode
      }
      format
      status
      seasonYear
    }
  }
}
"""

ANILIST_ID_QUERY = """
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    title {
      english
      romaji
      native
    }
    coverImage {
      large
      extraLarge
    }
    bannerImage
    episodes
    nextAiringEpisode {
      episode
    }
    format
    status
    seasonYear
  }
}
"""

def clean_slug(title: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9\s-]', '', title).strip().lower()
    return re.sub(r'[\s-]+', '-', cleaned)

@router.get("/search")
async def search_miruro(q: str):
    """
    Search Miruro library using AniList metadata and Miruro watch URL format.
    """
    if not q or not q.strip():
        return {"results": [], "source": "miruro"}

    clean_query = q.strip()
    results = []

    try:
        async with httpx.AsyncClient(headers={"Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"]}, timeout=10) as client:
            resp = await client.post(
                ANILIST_GRAPHQL_URL,
                json={"query": ANILIST_SEARCH_QUERY, "variables": {"search": clean_query}}
            )

        if resp.status_code == 200:
            data = resp.json()
            media_list = data.get("data", {}).get("Page", {}).get("media", [])
            for item in media_list:
                item_id = item.get("id")
                titles = item.get("title", {})
                english = titles.get("english")
                romaji = titles.get("romaji")
                chosen_title = english or romaji or titles.get("native") or "Untitled"
                
                # Determine total episodes released or available
                eps = item.get("episodes")
                next_airing = item.get("nextAiringEpisode")
                if not eps and next_airing:
                    eps = next_airing.get("episode", 1) - 1
                if not eps:
                    eps = 12

                slug = clean_slug(chosen_title)
                cover = item.get("coverImage", {}).get("extraLarge") or item.get("coverImage", {}).get("large") or ""
                
                results.append({
                    "title": chosen_title,
                    "url": f"https://www.miruro.to/watch?id={item_id}&ep=1",
                    "id": item_id,
                    "slug": slug,
                    "thumbnail": cover,
                    "sub_episodes": str(eps),
                    "dub_episodes": str(eps),
                    "type": item.get("format", "TV"),
                    "source": "miruro",
                    "year": item.get("seasonYear")
                })
    except Exception as e:
        print(f"[Miruro Search Error] {e}")

    return {"results": results, "source": "miruro"}

@router.get("/episodes")
async def get_miruro_episodes(url: str):
    """
    Generate episode list for Miruro anime with watch URLs and alternatives.
    """
    # Extract anime ID from url e.g. "https://www.miruro.to/watch?id=21&ep=1" or "miruro:21"
    anime_id = None
    id_match = re.search(r'id=(\d+)', url) or re.search(r'miruro:(\d+)', url) or re.search(r'/watch/(\d+)', url)
    if id_match:
        anime_id = int(id_match.group(1))

    title = "Anime"
    thumbnail = ""
    total_episodes = 12
    slug = "watch"

    if anime_id:
        try:
            async with httpx.AsyncClient(headers={"Content-Type": "application/json", "User-Agent": HEADERS["User-Agent"]}, timeout=10) as client:
                resp = await client.post(
                    ANILIST_GRAPHQL_URL,
                    json={"query": ANILIST_ID_QUERY, "variables": {"id": anime_id}}
                )
            if resp.status_code == 200:
                data = resp.json().get("data", {}).get("Media", {})
                titles = data.get("title", {})
                title = titles.get("english") or titles.get("romaji") or "Anime"
                slug = clean_slug(title)
                thumbnail = data.get("coverImage", {}).get("large") or ""
                eps = data.get("episodes")
                next_airing = data.get("nextAiringEpisode")
                if not eps and next_airing:
                    eps = next_airing.get("episode", 1) - 1
                if eps:
                    total_episodes = eps
        except Exception as e:
            print(f"[Miruro Episodes Error] {e}")

    episodes = []
    # Build list of 1 to total_episodes
    for ep_num in range(1, total_episodes + 1):
        episodes.append({
            "number": str(ep_num),
            "title": f"Episode {ep_num}",
            "url": f"https://www.miruro.to/watch?id={anime_id or 21}&ep={ep_num}",
            "anime_id": anime_id or 21,
            "slug": slug
        })

    return {
        "title": title,
        "thumbnail": thumbnail,
        "episodes": episodes,
        "source": "miruro"
    }

@router.get("/resolve")
async def resolve_miruro_stream(url: str, ep: Optional[str] = "1", sub_dub: Optional[str] = "sub"):
    """
    Resolves active Miruro server mirrors and embedded player routes.
    """
    anime_id = "21"
    id_match = re.search(r'id=(\d+)', url) or re.search(r'/watch/(\d+)', url)
    if id_match:
        anime_id = id_match.group(1)

    ep_num = ep or "1"
    ep_match = re.search(r'ep=(\d+)', url)
    if ep_match:
        ep_num = ep_match.group(1)

    primary_url = f"https://www.miruro.to/watch?id={anime_id}&ep={ep_num}"
    
    alternatives = [
        {"name": "Miruro TO (Official Primary)", "url": f"https://www.miruro.to/watch?id={anime_id}&ep={ep_num}"},
        {"name": "Miruro CX Mirror", "url": f"https://miruro.cx/watch?id={anime_id}&ep={ep_num}"},
        {"name": "Miruro TV Mirror", "url": f"https://miruro.tv/watch/{anime_id}/watch?ep={ep_num}"},
        {"name": "Miruro BZ Mirror", "url": f"https://miruro.bz/watch?id={anime_id}&ep={ep_num}"},
    ]

    return {
        "url": primary_url,
        "alternatives": alternatives,
        "source": "miruro"
    }
