import httpx
from fastapi import APIRouter
from bs4 import BeautifulSoup
import re
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import DynamicBaseURL
from client import SharedClientContext

# Monkey-patch httpx.AsyncClient to enable connection pooling
httpx.AsyncClient = SharedClientContext

router = APIRouter()

BASE_URL = "https://www.youtube.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

@router.get("/search")
async def search_museasia(q: str):
    # Search for playlists or videos related to Muse Asia on YouTube
    # We query with "Muse Asia" prefix to focus search on Muse Asia official videos/playlists
    search_query = f"Muse Asia {q}"
    url = f"{BASE_URL}/results"
    params = {
        "search_query": search_query
    }
    
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url, params=params)
        
    match = re.search(r'var ytInitialData\s*=\s*({.*?});', resp.text)
    if not match:
        return {"results": [], "source": "museasia"}
        
    try:
        data = json.loads(match.group(1))
        contents = data["contents"]["twoColumnSearchResultsRenderer"]["primaryContents"]["sectionListRenderer"]["contents"][0]["itemSectionRenderer"]["contents"]
    except Exception:
        return {"results": [], "source": "museasia"}
        
    results = []
    for item in contents:
        # 1. Old Playlist Renderer
        playlist = item.get("playlistRenderer")
        if playlist:
            title = playlist["title"]["simpleText"] if "simpleText" in playlist["title"] else playlist["title"]["runs"][0]["text"]
            playlist_id = playlist["playlistId"]
            channel_runs = playlist.get("shortBylineText", {}).get("runs", [])
            channel_name = channel_runs[0]["text"] if channel_runs else "Unknown"
            
            if "muse" in channel_name.lower() or "asia" in channel_name.lower():
                results.append({
                    "title": title,
                    "url": f"https://www.youtube.com/playlist?list={playlist_id}",
                    "thumbnail": f"https://img.youtube.com/vi/{playlist_id}/0.jpg",
                    "sub_episodes": "?",
                    "dub_episodes": "0",
                    "type": "Playlist",
                    "source": "museasia"
                })
                
        # 2. Old Video Renderer
        video = item.get("videoRenderer")
        if video:
            title = video["title"]["runs"][0]["text"]
            video_id = video["videoId"]
            channel_name = video["ownerText"]["runs"][0]["text"]
            
            if "muse" in channel_name.lower() or "asia" in channel_name.lower():
                results.append({
                    "title": title,
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/0.jpg",
                    "sub_episodes": "1",
                    "dub_episodes": "0",
                    "type": "Video",
                    "source": "museasia"
                })

        # 3. New Lockup View Model (modern YouTube layout)
        lockup = item.get("lockupViewModel")
        if lockup:
            content_type = lockup.get("contentType")
            content_id = lockup.get("contentId")
            metadata = lockup.get("metadata", {}).get("lockupMetadataViewModel", {})
            title = metadata.get("title", {}).get("content", "")
            
            channel_name = ""
            for line in metadata.get("metadataRows", []):
                for part in line.get("metadataParts", []):
                    text_content = part.get("text", {}).get("content", "")
                    if "muse" in text_content.lower() or "asia" in text_content.lower():
                        channel_name = text_content
            
            if "muse" in channel_name.lower() or "asia" in channel_name.lower() or "muse" in title.lower():
                if content_type == "LOCKUP_CONTENT_TYPE_PLAYLIST":
                    results.append({
                        "title": title,
                        "url": f"https://www.youtube.com/playlist?list={content_id}",
                        "thumbnail": f"https://i.ytimg.com/vi/{content_id}/0.jpg",
                        "sub_episodes": "?",
                        "dub_episodes": "0",
                        "type": "Playlist",
                        "source": "museasia"
                    })
                elif content_type == "LOCKUP_CONTENT_TYPE_VIDEO":
                    results.append({
                        "title": title,
                        "url": f"https://www.youtube.com/watch?v={content_id}",
                        "thumbnail": f"https://img.youtube.com/vi/{content_id}/0.jpg",
                        "sub_episodes": "1",
                        "dub_episodes": "0",
                        "type": "Video",
                        "source": "museasia"
                    })
                    
    return {"results": results, "source": "museasia"}


@router.get("/episodes")
async def get_episodes(url: str):
    if "list=" not in url:
        # Single video url
        video_id = url.split("v=")[1].split("&")[0] if "v=" in url else url
        return {
            "title": "Single Episode",
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/0.jpg",
            "episodes": [{
                "number": "1",
                "title": "Episode 1",
                "url": f"https://www.youtube.com/watch?v={video_id}"
            }],
            "source": "museasia"
        }
        
    playlist_id = url.split("list=")[1].split("&")[0]
    playlist_url = f"{BASE_URL}/playlist?list={playlist_id}"
    
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(playlist_url)
        
    match = re.search(r'var ytInitialData\s*=\s*({.*?});', resp.text)
    if not match:
        return {"title": "Playlist", "thumbnail": "", "episodes": [], "source": "museasia"}
        
    try:
        data = json.loads(match.group(1))
        
        # Extract title
        metadata_el = data.get("metadata", {}).get("playlistMetadataRenderer", {})
        title = metadata_el.get("title", "Playlist")
        
        # Traverse list items (lockupViewModel)
        lockup_items = []
        def find_lockups(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k == "lockupViewModel":
                        lockup_items.append(v)
                    find_lockups(v)
            elif isinstance(obj, list):
                for item in obj:
                    find_lockups(item)

        find_lockups(data)
        
        episodes = []
        ep_index = 1
        for item in lockup_items:
            content_type = item.get("contentType")
            content_id = item.get("contentId")
            metadata = item.get("metadata", {}).get("lockupMetadataViewModel", {})
            v_title = metadata.get("title", {}).get("content", f"Episode {ep_index}")
            
            if content_type == "LOCKUP_CONTENT_TYPE_VIDEO":
                # Clean up episode number from title
                # e.g., "Wistoria: Wand and Sword - Episode 01 [English Sub]"
                num_match = re.search(r'Episode\s+([A-Za-z0-9.-]+)', v_title, re.IGNORECASE)
                ep_num = num_match.group(1) if num_match else str(ep_index)
                
                episodes.append({
                    "number": ep_num,
                    "title": v_title,
                    "url": f"https://www.youtube.com/watch?v={content_id}"
                })
                ep_index += 1
                
        # Sort episodes by number if possible
        try:
            episodes.sort(key=lambda x: float(x["number"]))
        except Exception:
            pass
            
        thumbnail = episodes[0]["thumbnail"] if episodes else ""
        if not thumbnail and episodes:
            video_id = episodes[0]["url"].split("v=")[1].split("&")[0]
            thumbnail = f"https://img.youtube.com/vi/{video_id}/0.jpg"
            
        return {"title": title, "thumbnail": thumbnail, "episodes": episodes, "source": "museasia"}
    except Exception as e:
        print("[MuseAsia Error] Failed to parse playlist:", str(e))
        return {"title": "Playlist", "thumbnail": "", "episodes": [], "source": "museasia"}


@router.get("/resolve")
async def resolve_stream(url: str):
    # Resolve YouTube watch url to native embed URL
    video_id = url.split("v=")[1].split("&")[0] if "v=" in url else url
    embed_url = f"https://www.youtube.com/embed/{video_id}"
    return {"url": embed_url}
