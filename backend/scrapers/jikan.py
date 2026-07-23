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

TITLE_REPLACEMENTS = {
    "demon slayer": "Kimetsu no Yaiba",
    "demon slayer: kimetsu no yaiba": "Kimetsu no Yaiba",
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
    q_lower = q.lower().strip() if q else ""
    search_q = TITLE_REPLACEMENTS.get(q_lower, q)
    query = """
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
          """ + MEDIA_FRAGMENT + """
        }
      }
    }
    """
    result = await anilist_post(query, {"search": search_q, "page": page})
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
    anime_list = None
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
            "id": item.get("id"),
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
        characters(role: MAIN, perPage: 8) {
          edges {
            node {
              id
              name {
                full
              }
              image {
                medium
              }
            }
          }
        }
        trailer {
          site
          id
          thumbnail
        }
      }
    }
    """

    variables = {}
    if id:
        variables["id"] = id
    else:
        title_lower = title.lower().strip() if title else ""
        variables["search"] = TITLE_REPLACEMENTS.get(title_lower, title)

    # Stage 1: Direct Media Search
    result = await anilist_post(query, variables)
    errors = result.get("errors")
    media = (result.get("data") or {}).get("Media")

    page_query = """
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
          id
        }
      }
    }
    """

    # Stage 2: Page Search with exact title if direct Media search gave 404/error
    if (errors or not media) and title:
        try:
            page_res = await anilist_post(page_query, {"search": title})
            page_media = ((page_res.get("data") or {}).get("Page") or {}).get("media") or []
            if page_media:
                found_id = page_media[0]["id"]
                result = await anilist_post(query, {"id": found_id})
                errors = result.get("errors")
                media = (result.get("data") or {}).get("Media")
        except:
            pass

    # Stage 3: Cleaned Title Search (strip Season X, Part Y, S2, 2nd Season, OVA, Movie, etc.)
    if (errors or not media) and title:
        import re
        cleaned = re.sub(r"\[.*?\]|\(.*?\)", "", title)
        cleaned = re.sub(r"\s*(Season\s*\d+.*|Part\s*\d+.*|S\d+.*|\d+(st|nd|rd|th)\s*Season.*|Movie|Special|Specials|OVA|ONA|Dub|Sub)$", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"[:,.-]$", "", cleaned).strip()
        cleaned = " ".join(cleaned.split())

        if cleaned and cleaned.lower() != title.lower():
            try:
                page_res = await anilist_post(page_query, {"search": cleaned})
                page_media = ((page_res.get("data") or {}).get("Page") or {}).get("media") or []
                if page_media:
                    found_id = page_media[0]["id"]
                    result = await anilist_post(query, {"id": found_id})
                    errors = result.get("errors")
                    media = (result.get("data") or {}).get("Media")
            except:
                pass

    # Stage 4: Base Name Search (first 2-3 words excluding Season/Part keywords)
    if (errors or not media) and title:
        import re
        words = [w for w in title.split() if w.lower() not in ["season", "part", "2nd", "3rd", "4th", "1st", "s2", "s3", "s4"]]
        if len(words) >= 2:
            base_name = " ".join(words[:3] if len(words) >= 3 else words[:2])
            base_name = re.sub(r"[:,.-]$", "", base_name).strip()
            try:
                page_res = await anilist_post(page_query, {"search": base_name})
                page_media = ((page_res.get("data") or {}).get("Page") or {}).get("media") or []
                if page_media:
                    found_id = page_media[0]["id"]
                    result = await anilist_post(query, {"id": found_id})
                    errors = result.get("errors")
                    media = (result.get("data") or {}).get("Media")
            except:
                pass

    if errors and not media:
        return {"error": errors[0].get("message", "Anime not found")}

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

    # Parse characters
    characters = []
    char_edges = (media.get("characters") or {}).get("edges") or []
    for edge in char_edges:
        node = edge.get("node")
        if node:
            characters.append({
                "id": node.get("id"),
                "name": (node.get("name") or {}).get("full") or "Unknown",
                "image": (node.get("image") or {}).get("medium") or "",
            })

    # Parse trailer
    trailer = media.get("trailer")
    trailer_data = None
    if trailer and trailer.get("site") == "youtube":
        trailer_data = {
            "id": trailer.get("id"),
            "url": f"https://www.youtube.com/embed/{trailer.get('id')}",
            "thumbnail": trailer.get("thumbnail"),
        }

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
        "characters": characters,
        "trailer": trailer_data,
    }


@router.get("/watch-order")
async def get_watch_order(id: int):
    """Retrieve chronologically/release ordered watch path for a franchise."""
    visited = set()
    queue = [id]
    franchise = []

    # Limit to maximum 6 queries to avoid hitting rate limits
    max_queries = 6
    queries_made = 0

    while queue and queries_made < max_queries:
        current_id = queue.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)

        query = """
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title { english romaji }
            coverImage { large }
            format
            seasonYear
            startDate { year month }
            status
            relations {
              edges {
                relationType
                node {
                  id
                  type
                }
              }
            }
          }
        }
        """
        res = await anilist_post(query, {"id": current_id})
        queries_made += 1

        media = (res.get("data") or {}).get("Media")
        if not media:
            continue

        title_en = (media.get("title") or {}).get("english") or (media.get("title") or {}).get("romaji", "")
        year = media.get("seasonYear") or (media.get("startDate") or {}).get("year")

        franchise.append({
            "id": media.get("id"),
            "title": title_en,
            "cover": (media.get("coverImage") or {}).get("large") or "",
            "year": year,
            "format": (media.get("format") or "TV").replace("_", " "),
            "status": media.get("status"),
        })

        edges = (media.get("relations") or {}).get("edges") or []
        for edge in edges:
            node = edge.get("node")
            rel_type = edge.get("relationType", "")
            if node and node.get("type") == "ANIME":
                rel_id = node.get("id")
                if rel_id not in visited and rel_id not in queue:
                    # Follow main prequel/sequel relations
                    if rel_type in ["PREQUEL", "SEQUEL"]:
                        queue.append(rel_id)

    # Sort by year
    franchise.sort(key=lambda x: x.get("year") or 9999)

    # Format the index/order
    for idx, item in enumerate(franchise):
        item["order"] = idx + 1

    return {"watch_order": franchise}


@router.get("/recommendations")
async def get_history_recommendations(ids: Optional[str] = None):
    """Fetch recommendations from AniList based on a comma-separated list of media IDs."""
    if not ids:
        # Fall back to trending anime if no IDs are supplied
        query = """
        query {
          Page(perPage: 12) {
            media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
              """ + MEDIA_FRAGMENT + """
            }
          }
        }
        """
        result = await anilist_post(query)
        anime_list = ((result.get("data") or {}).get("Page") or {}).get("media") or []
        return {"results": [parse_media(a) for a in anime_list]}

    id_list = []
    for x in ids.split(","):
        try:
            if x.strip() and x.strip() != '0':
                id_list.append(int(x.strip()))
        except ValueError:
            continue

    if not id_list:
        # Fall back
        query = """
        query {
          Page(perPage: 12) {
            media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
              """ + MEDIA_FRAGMENT + """
            }
          }
        }
        """
        result = await anilist_post(query)
        anime_list = ((result.get("data") or {}).get("Page") or {}).get("media") or []
        return {"results": [parse_media(a) for a in anime_list]}

    # Fetch recommendations for each ID concurrently
    query = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(perPage: 6) {
          nodes {
            mediaRecommendation {
              """ + MEDIA_FRAGMENT + """
            }
          }
        }
      }
    }
    """
    
    tasks = [anilist_post(query, {"id": anime_id}) for anime_id in id_list[:4]]
    responses = await asyncio.gather(*tasks, return_exceptions=True)

    recommended_map = {}
    for resp in responses:
        if isinstance(resp, Exception) or not resp:
            continue
        media = (resp.get("data") or {}).get("Media") or {}
        nodes = (media.get("recommendations") or {}).get("nodes") or []
        for node in nodes:
            rec_media = node.get("mediaRecommendation")
            if rec_media and rec_media.get("id"):
                rec_id = rec_media.get("id")
                # Avoid recommending any of the input seed IDs
                if rec_id in id_list:
                    continue
                recommended_map[rec_id] = parse_media(rec_media)

    # Convert map to list and sort by popularity / score (or keep order)
    results = list(recommended_map.values())
    # Shuffle or limit to 15
    import random
    random.shuffle(results)
    return {"results": results[:15]}


@router.get("/jikan/characters")
async def get_characters(id: int):
    """Fetch character list for an anime from AniList GraphQL API."""
    query = """
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        characters(sort: ROLE, perPage: 20) {
          edges {
            role
            node {
              id
              name { full }
              image { medium large }
            }
          }
        }
      }
    }
    """
    try:
        data = await anilist_post(query, {"id": id})
        edges = ((data.get("data") or {}).get("Media") or {}).get("characters", {}).get("edges", [])
        characters = []
        for edge in edges:
            node = edge.get("node", {})
            if not node:
                continue
            characters.append({
                "id": node.get("id"),
                "name": (node.get("name") or {}).get("full", "Unknown"),
                "image": (node.get("image") or {}).get("large") or (node.get("image") or {}).get("medium", ""),
                "role": edge.get("role", "SUPPORTING").capitalize(),
            })
        return characters
    except Exception as e:
        return []

