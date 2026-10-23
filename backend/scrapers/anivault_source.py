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
async def search_anivault(q: str):
    """
    Search AniVault TV source using AniList index & AniVault media identifiers.
    """
    if not q or not q.strip():
        return {"results": [], "source": "anivault"}

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
                chosen_title = titles.get("english") or titles.get("romaji") or titles.get("native") or "Untitled"
                slug = clean_slug(chosen_title)

                eps = item.get("episodes")
                next_airing = item.get("nextAiringEpisode")
                if not eps and next_airing:
                    eps = next_airing.get("episode", 1) - 1
                if not eps:
                    eps = 12

                cover = item.get("coverImage", {}).get("extraLarge") or item.get("coverImage", {}).get("large") or ""

                results.append({
                    "title": chosen_title,
                    "url": f"https://anivault.tv/watch/{item_id}/{slug}?ep=1",
                    "id": item_id,
                    "slug": slug,
                    "thumbnail": cover,
                    "sub_episodes": str(eps),
                    "dub_episodes": str(eps),
                    "type": item.get("format", "TV"),
                    "source": "anivault",
                    "year": item.get("seasonYear")
                })
    except Exception as e:
        print(f"[AniVault Search Error] {e}")

    return {"results": results, "source": "anivault"}

@router.get("/episodes")
async def get_anivault_episodes(url: str):
    """
    Generate episode list for AniVault TV anime.
    """
    anime_id = None
    id_match = re.search(r'/watch/(\d+)', url) or re.search(r'id=(\d+)', url)
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
            print(f"[AniVault Episodes Error] {e}")

    episodes = []
    for ep_num in range(1, total_episodes + 1):
        episodes.append({
            "number": str(ep_num),
            "title": f"Episode {ep_num}",
            "url": f"https://anivault.tv/watch/{anime_id or 21}/{slug}?ep={ep_num}",
            "anime_id": anime_id or 21,
            "slug": slug
        })

    return {
        "title": title,
        "thumbnail": thumbnail,
        "episodes": episodes,
        "source": "anivault"
    }

@router.get("/resolve")
async def resolve_anivault_stream(url: str, ep: Optional[str] = "1", sub_dub: Optional[str] = "sub"):
    """
    Resolves active AniVault TV streaming route and fast mirrors.
    """
    anime_id = "21"
    slug = "watch"

    id_match = re.search(r'/watch/(\d+)/?([^/?#]*)', url)
    if id_match:
        anime_id = id_match.group(1)
        if id_match.group(2):
            slug = id_match.group(2)
    else:
        id_m2 = re.search(r'id=(\d+)', url)
        if id_m2:
            anime_id = id_m2.group(1)

    ep_num = ep or "1"
    ep_match = re.search(r'ep=(\d+)', url)
    if ep_match:
        ep_num = ep_match.group(1)

    primary_url = f"https://anivault.tv/watch/{anime_id}/{slug}?ep={ep_num}"
    
    alternatives = [
        {"name": "AniVault TV (Primary Player)", "url": f"https://anivault.tv/watch/{anime_id}/{slug}?ep={ep_num}"},
        {"name": "AniVault Mirror (Fast CDN)", "url": f"https://barelystarted.miruro.tv/watch/{anime_id}/{slug}?ep={ep_num}"},
        {"name": "Miruro TO Mirror", "url": f"https://www.miruro.to/watch?id={anime_id}&ep={ep_num}"},
    ]

    return {
        "url": primary_url,
        "alternatives": alternatives,
        "source": "anivault"
    }
