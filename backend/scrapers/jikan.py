import httpx
import asyncio
from typing import Optional
from fastapi import APIRouter

router = APIRouter()

# AniList GraphQL API - CDN-backed, fast, free, no auth needed
ANILIST = "https://graphql.anilist.co"
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# AniList uses genre names directly as strings
GENRE_MAP = {
    "action": "Action",
    "adventure": "Adventure",
    "comedy": "Comedy",
    "drama": "Drama",
    "ecchi": "Ecchi",
    "fantasy": "Fantasy",
    "mystery": "Mystery",
    "psychological": "Psychological",
    "romance": "Romance",
    "sci-fi": "Sci-Fi",
    "slice of life": "Slice of Life",
    "supernatural": "Supernatural",
    "thriller": "Thriller",
    "horror": "Horror",
    "sports": "Sports",
    "mecha": "Mecha",
    "music": "Music",
    "school": "School",
    "shounen": "Action",  # AniList uses demographics differently; map to closest
    "shoujo": "Romance",
    "seinen": "Seinen",
    "isekai": "Adventure",
}

MEDIA_FRAGMENT = """
  id
  title { english romaji }
  coverImage { large extraLarge }
  episodes
  format
  averageScore
  status
  startDate { year }
"""


async def anilist_post(query: str, variables: dict = None) -> dict:
    payload = {"query": query, "variables": variables or {}}
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20) as client:
            resp = await client.post(ANILIST, json=payload)
            if resp.status_code != 200:
                return {"errors": [{"message": f"HTTP {resp.status_code}"}], "data": None}
            return resp.json()
    except Exception as e:
        return {"errors": [{"message": str(e)}], "data": None}


def parse_media(item: dict) -> dict:
    title_en = (item.get("title") or {}).get("english") or (item.get("title") or {}).get("romaji", "")
    title_jp = (item.get("title") or {}).get("romaji", "")
    score = item.get("averageScore")
    if score:
        score = round(score / 10, 1)
    img = (item.get("coverImage") or {})
    thumbnail = img.get("extraLarge") or img.get("large", "")
    return {
        "title": title_en or title_jp,
        "title_japanese": title_jp,
        "thumbnail": thumbnail,
        "sub_episodes": str(item.get("episodes") or "?"),
        "dub_episodes": "0",
        "type": (item.get("format") or "TV").replace("_", " "),
        "score": score,
        "source": "jikan",
        "mal_id": item.get("id"),
        "year": (item.get("startDate") or {}).get("year"),
        "status": item.get("status"),
        "ep": item.get("episodes") or "?",
    }


@router.get("/by-genre")
async def get_by_genre(genre: str, page: int = 1):
    genre_lower = genre.lower()
    genre_name = GENRE_MAP.get(genre_lower, genre.title())

    query = """
    query ($genre: String, $page: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage lastPage }
        media(type: ANIME, genre: $genre, sort: SCORE_DESC, isAdult: false) {
          """ + MEDIA_FRAGMENT + """
        }
      }
    }
    """
    result = await anilist_post(query, {"genre": genre_name, "page": page})
    errors = result.get("errors")
    page_data = (result.get("data") or {}).get("Page") or {}
    anime_list = page_data.get("media") or []
    page_info = page_data.get("pageInfo") or {}

    if errors and not anime_list:
        return {"results": [], "genre": genre, "error": errors[0].get("message", "Unknown error")}

    return {
        "results": [parse_media(a) for a in anime_list],
        "genre": genre,
        "page": page,
        "has_next": page_info.get("hasNextPage", False),
    }


@router.get("/search")
async def search_jikan(q: str, page: int = 1):
    query = """
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
          """ + MEDIA_FRAGMENT + """
        }
      }
    }
    """
    result = await anilist_post(query, {"search": q, "page": page})
    anime_list = ((result.get("data") or {}).get("Page") or {}).get("media") or []
    return {"results": [parse_media(a) for a in anime_list], "source": "jikan"}


@router.get("/airing")
async def get_airing(limit: int = 20):
    query = """
    query ($perPage: Int) {
      Page(perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
          """ + MEDIA_FRAGMENT + """
          nextAiringEpisode { episode }
        }
      }
    }
    """
    result = await anilist_post(query, {"perPage": limit})
    anime_list = ((result.get("data") or {}).get("Page") or {}).get("media") or []

    results = []
    for item in anime_list:
        r = parse_media(item)
        # Use next airing episode number if available
        nae = item.get("nextAiringEpisode")
        if nae and nae.get("episode"):
            r["ep"] = nae["episode"] - 1 if nae["episode"] > 1 else nae["episode"]
        results.append(r)

    return {"results": results}


@router.get("/all")
async def get_all_anime(page: int = 1, letter: str = None):
    if letter and letter != "#":
        # Sort alphabetically ascending - A titles appear on page 1
        # Use search with letter to find relevant anime
        query = """
        query ($search: String, $page: Int) {
          Page(page: $page, perPage: 24) {
            pageInfo { hasNextPage currentPage lastPage }
            media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
              """ + MEDIA_FRAGMENT + """
            }
          }
        }
        """
        # Try with the letter, fall back to letter+common suffix if 0 results
        result = await anilist_post(query, {"search": letter, "page": page})
        anime_list = ((result.get("data") or {}).get("Page") or {}).get("media") or []

        # If no results (letter too short for AniList search), use alphabetical sort
        if not anime_list:
            fallback_query = """
            query ($page: Int) {
              Page(page: $page, perPage: 24) {
                pageInfo { hasNextPage currentPage lastPage }
                media(type: ANIME, sort: TITLE_ENGLISH, isAdult: false) {
                  """ + MEDIA_FRAGMENT + """
                }
              }
            }
            """
            result = await anilist_post(fallback_query, {"page": page})
            page_data = ((result.get("data") or {}).get("Page")) or {}
            all_items = page_data.get("media") or []
            # Filter client-side to titles starting with selected letter
            anime_list = [
                i for i in all_items
                if ((i.get("title") or {}).get("english") or (i.get("title") or {}).get("romaji") or "").upper().startswith(letter.upper())
            ]
            # If still none (e.g. page doesn't have that letter yet), return raw alphabetical
            if not anime_list:
                anime_list = all_items
    else:
        # Default: most popular anime
        query = """
        query ($page: Int) {
          Page(page: $page, perPage: 24) {
            pageInfo { hasNextPage currentPage lastPage }
            media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
              """ + MEDIA_FRAGMENT + """
            }
          }
        }
        """
        result = await anilist_post(query, {"page": page})

    errors = result.get("errors")
    page_data = ((result.get("data") or {}).get("Page")) or {}
    if not anime_list:
        anime_list = page_data.get("media") or []
    page_info = page_data.get("pageInfo") or {}

    if errors and not anime_list:
        return {
            "results": [],
            "error": errors[0].get("message", "Unknown error"),
            "page": page, "has_next": False, "total_pages": 1,
        }

    return {
        "results": [parse_media(a) for a in anime_list],
        "page": page,
        "has_next": page_info.get("hasNextPage", False),
        "total_pages": page_info.get("lastPage", 1),
        "letter": letter,
    }


@router.get("/hero-slides")
async def get_hero_slides():
    """Return randomized trending anime with banner images for the home hero."""
    import random
    query = """
    query {
      Page(perPage: 25) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false, format_in: [TV]) {
          id
          title { english romaji }
          description(asHtml: false)
          bannerImage
          coverImage { extraLarge large }
          format
          episodes
          averageScore
          genres
          status
          season
          seasonYear
        }
      }
    }
    """
    result = await anilist_post(query)
    anime_list = ((result.get("data") or {}).get("Page") or {}).get("media") or []

    # Only use anime that have a bannerImage
    with_banners = [a for a in anime_list if a.get("bannerImage")]
    if not with_banners:
        return {"slides": []}

    # Shuffle and pick up to 6
    random.shuffle(with_banners)
    picks = with_banners[:6]

    slides = []
    for item in picks:
        title_en = (item.get("title") or {}).get("english") or (item.get("title") or {}).get("romaji", "")
        # Strip HTML from description
        desc = (item.get("description") or "").replace("<br>", " ").replace("<br/>", " ")
        import re
        desc = re.sub(r"<[^>]+>", "", desc)[:180]
        score = item.get("averageScore")
        episodes = item.get("episodes") or "?"
        slides.append({
            "title": title_en,
            "synopsis": desc,
            "image": item.get("bannerImage") or (item.get("coverImage") or {}).get("extraLarge", ""),
            "type": (item.get("format") or "TV").replace("_", " "),
            "episodes": str(episodes),
            "rating": f"{round(score/10,1)}/10" if score else "N/A",
            "genres": item.get("genres") or [],
        })

    return {"slides": slides}


@router.get("/details")
async def get_details(id: Optional[int] = None, title: Optional[str] = None):
    """Get full details of an anime by ID or Title from AniList."""
    if not id and not title:
        return {"error": "Must provide id or title"}

    query = """
    query ($id: Int, $search: String) {
      Media(id: $id, search: $search, type: ANIME) {
        id
        title {
          english
          romaji
          native
        }
        bannerImage
        coverImage {
          extraLarge
          large
        }
        description(asHtml: false)
        startDate { year month day }
        endDate { year month day }
        season
        seasonYear
        status
        episodes
        duration
        genres
        averageScore
        studios(isMain: true) {
          nodes {
            name
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              title { english romaji }
              type
              status
            }
          }
        }
        recommendations(perPage: 6) {
          nodes {
            mediaRecommendation {
              id
              title { english romaji }
              coverImage { large }
              type
            }
          }
        }
      }
    }
    """

    variables = {}
    if id:
        variables["id"] = id
    else:
        variables["search"] = title

    result = await anilist_post(query, variables)
    errors = result.get("errors")
    media = (result.get("data") or {}).get("Media")

    if errors and not media:
        return {"error": errors[0].get("message", "Unknown error")}

    # Parse relations to find prequel, sequel, spin-offs, alternative setting etc.
    relations = []
    edges = (media.get("relations") or {}).get("edges") or []
    for edge in edges:
        node = edge.get("node")
        if node and node.get("type") == "ANIME":
            rel_type = edge.get("relationType", "")
            title_en = (node.get("title") or {}).get("english") or (node.get("title") or {}).get("romaji", "")
            relations.append({
                "id": node.get("id"),
                "title": title_en,
                "relation": rel_type.replace("_", " ").title(),
                "status": node.get("status"),
            })

    # Parse recommendations
    recommendations = []
    rec_nodes = (media.get("recommendations") or {}).get("nodes") or []
    for node in rec_nodes:
        rec_media = node.get("mediaRecommendation")
        if rec_media:
            title_en = (rec_media.get("title") or {}).get("english") or (rec_media.get("title") or {}).get("romaji", "")
            img = (rec_media.get("coverImage") or {}).get("large", "")
            recommendations.append({
                "id": rec_media.get("id"),
                "title": title_en,
                "thumbnail": img,
                "type": rec_media.get("type"),
            })

    # Clean description from HTML tags
    desc = media.get("description") or ""
    import re
    desc = re.sub(r"<[^>]+>", "", desc)

    title_en = (media.get("title") or {}).get("english") or (media.get("title") or {}).get("romaji", "")
    title_rom = (media.get("title") or {}).get("romaji", "")
    title_nat = (media.get("title") or {}).get("native", "")

    studio_list = (media.get("studios") or {}).get("nodes") or []
    studio = studio_list[0].get("name") if studio_list else "Unknown"

    score = media.get("averageScore")
    if score:
        score = round(score / 10, 1)

    return {
        "id": media.get("id"),
        "title": title_en,
        "title_romaji": title_rom,
        "title_native": title_nat,
        "banner": media.get("bannerImage") or "",
        "cover": (media.get("coverImage") or {}).get("extraLarge") or (media.get("coverImage") or {}).get("large") or "",
        "description": desc,
        "status": media.get("status"),
        "episodes": media.get("episodes"),
        "duration": media.get("duration"),
        "score": score,
        "genres": media.get("genres") or [],
        "studio": studio,
        "year": media.get("seasonYear") or (media.get("startDate") or {}).get("year"),
        "season": media.get("season"),
        "relations": relations,
        "recommendations": recommendations,
    }

