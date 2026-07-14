import httpx
from fastapi import APIRouter

router = APIRouter()

# Jikan v4 - free MyAnimeList API, no auth needed
JIKAN = "https://api.jikan.moe/v4"

# Map genre names to MyAnimeList genre IDs
GENRE_IDS = {
    "action": 1,
    "adventure": 2,
    "comedy": 4,
    "drama": 8,
    "ecchi": 9,
    "fantasy": 10,
    "mystery": 7,
    "psychological": 40,
    "romance": 22,
    "sci-fi": 24,
    "slice of life": 36,
    "supernatural": 37,
    "thriller": 41,
    "horror": 14,
    "sports": 30,
    "mecha": 18,
    "music": 19,
    "school": 23,
    "shounen": 27,
    "shoujo": 25,
    "seinen": 42,
    "isekai": 62,
}

HEADERS = {
    "User-Agent": "AniVault/1.0 (anime desktop app)",
    "Accept": "application/json",
}


@router.get("/by-genre")
async def get_by_genre(genre: str, page: int = 1):
    genre_lower = genre.lower()
    genre_id = GENRE_IDS.get(genre_lower)

    if not genre_id:
        return {"results": [], "genre": genre, "error": "Unknown genre"}

    url = f"{JIKAN}/anime?genres={genre_id}&order_by=score&sort=desc&limit=24&page={page}"
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url)

    data = resp.json()
    anime_list = data.get("data", [])

    results = []
    for item in anime_list:
        title_en = item.get("title_english") or item.get("title", "")
        title_jp = item.get("title", "")
        results.append({
            "title": title_en or title_jp,
            "title_japanese": title_jp,
            "url": item.get("url", ""),
            "thumbnail": item.get("images", {}).get("jpg", {}).get("large_image_url", ""),
            "sub_episodes": str(item.get("episodes") or "?"),
            "dub_episodes": "0",
            "type": item.get("type", "TV"),
            "score": item.get("score"),
            "source": "jikan",
            "mal_id": item.get("mal_id"),
        })

    pagination = data.get("pagination", {})
    return {
        "results": results,
        "genre": genre,
        "page": page,
        "has_next": pagination.get("has_next_page", False),
    }


@router.get("/search")
async def search_jikan(q: str, page: int = 1):
    url = f"{JIKAN}/anime?q={q}&limit=20&page={page}&order_by=popularity"
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url)

    data = resp.json()
    anime_list = data.get("data", [])

    results = []
    for item in anime_list:
        title_en = item.get("title_english") or item.get("title", "")
        title_jp = item.get("title", "")
        results.append({
            "title": title_en or title_jp,
            "title_japanese": title_jp,
            "url": item.get("url", ""),
            "thumbnail": item.get("images", {}).get("jpg", {}).get("large_image_url", ""),
            "sub_episodes": str(item.get("episodes") or "?"),
            "dub_episodes": "0",
            "type": item.get("type", "TV"),
            "score": item.get("score"),
            "source": "jikan",
            "mal_id": item.get("mal_id"),
        })

    return {"results": results, "source": "jikan"}
