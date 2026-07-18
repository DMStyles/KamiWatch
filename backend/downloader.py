import asyncio
import json
import os
import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import yt_dlp
from bs4 import BeautifulSoup
from database import add_to_library

router = APIRouter()

active_downloads = {}

class DownloadRequest(BaseModel):
    url: str
    title: str
    episode: str
    quality: Optional[str] = "best"
    output_dir: Optional[str] = os.path.expanduser("~/Downloads/AniVault")
    download_id: str
    thumbnail: Optional[str] = ""
    source: Optional[str] = ""
    sub_dub: Optional[str] = "sub"

def get_format_selector(quality: str) -> str:
    quality_map = {
        "best": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]",
        "720p": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
        "480p": "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]",
    }
    return quality_map.get(quality, quality_map["best"])


@router.post("/start")
async def start_download(req: DownloadRequest):
    os.makedirs(req.output_dir, exist_ok=True)
    active_downloads[req.download_id] = {
        "id": req.download_id,
        "title": req.title,
        "episode": req.episode,
        "url": req.url,
        "status": "starting",
        "progress": 0,
        "speed": "",
        "eta": "",
        "output_path": "",
        "thumbnail": req.thumbnail,
        "source": req.source,
    }

    def progress_hook(d):
        dl = active_downloads.get(req.download_id, {})
        if d["status"] == "downloading":
            dl["status"] = "downloading"
            dl["progress"] = float(d.get("_percent_str", "0%").replace("%", "").strip())
            dl["speed"] = d.get("_speed_str", "")
            dl["eta"] = d.get("_eta_str", "")
        elif d["status"] == "finished":
            dl["status"] = "finished"
            dl["progress"] = 100
            file_path = d.get("filename", "")
            dl["output_path"] = file_path
            try:
                # Add to library database on completion
                add_to_library(
                    title=req.title,
                    episode=req.episode,
                    file_path=file_path,
                    thumbnail=req.thumbnail,
                    source=req.source
                )
            except Exception as e:
                print("[Database Error] failed to add to library:", str(e))

    async def resolve_embed_to_m3u8(embed_url: str) -> str:
        if ".m3u8" in embed_url or ".mp4" in embed_url:
            return embed_url
        import re
        import urllib.parse
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://anikototv.to/"
        }
        async with httpx.AsyncClient(headers=headers, timeout=10) as client:
            resp = await client.get(embed_url)
            if resp.status_code != 200:
                raise Exception(f"Failed to fetch embed page, HTTP {resp.status_code}")
            soup = BeautifulSoup(resp.text, "html.parser")
            player_el = soup.select_one("#megaplay-player")
            if not player_el:
                cid_match = re.search(r"cid\s*:\s*['\"]([^'\"]+)['\"]", resp.text)
                if cid_match:
                    data_id = cid_match.group(1)
                else:
                    raise Exception("No player ID element or settings found in embed page")
            else:
                data_id = player_el.get("data-id")
            if not data_id:
                raise Exception("Could not retrieve data-id from player configurations")
            parsed_uri = urllib.parse.urlparse(embed_url)
            domain = f"{parsed_uri.scheme}://{parsed_uri.netloc}"
            sources_url = f"{domain}/stream/getSources"
            ajax_headers = {
                **headers,
                "Referer": embed_url,
                "X-Requested-With": "XMLHttpRequest"
            }
            sources_resp = await client.get(sources_url, params={"id": data_id}, headers=ajax_headers)
            if sources_resp.status_code != 200:
                raise Exception(f"Failed to fetch stream sources, HTTP {sources_resp.status_code}")
            sources_json = sources_resp.json()
            stream_file = sources_json.get("sources", {}).get("file")
            if not stream_file:
                files = sources_json.get("sources", [])
                if isinstance(files, list) and len(files) > 0:
                    stream_file = files[0].get("file")
            if not stream_file:
                raise Exception(f"No stream file URL resolved. Payload: {sources_json}")
            return stream_file

    def run_download():
        target_url = req.url
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        # 1. Resolve Anikoto url
        if target_url.startswith("anikoto:"):
            try:
                from scrapers.anikoto import resolve_stream as anikoto_resolve
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                data_ids = target_url.split("anikoto:")[1]
                res = loop.run_until_complete(anikoto_resolve(data_ids, req.sub_dub))
                
                if "url" in res:
                    embed_url = res["url"]
                    headers["Referer"] = embed_url
                    try:
                        target_url = loop.run_until_complete(resolve_embed_to_m3u8(embed_url))
                    except Exception as re_err:
                        print(f"[Resolver Warning] Direct m3u8 resolution failed, falling back: {re_err}")
                        target_url = embed_url
                else:
                    raise Exception(res.get("error", "Failed to resolve stream link"))
                loop.close()
            except Exception as e:
                if req.download_id in active_downloads:
                    active_downloads[req.download_id]["status"] = "error"
                    active_downloads[req.download_id]["error"] = f"Anikoto resolver failed: {str(e)}"
                return

        # 2. Resolve KissAnime url
        elif "kissanime.com.vc" in target_url or target_url.startswith("kissanime:"):
            try:
                from scrapers.kissanime import resolve_stream as kiss_resolve
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                res = loop.run_until_complete(kiss_resolve(target_url))
                
                if "url" in res:
                    embed_url = res["url"]
                    headers["Referer"] = embed_url
                    try:
                        target_url = loop.run_until_complete(resolve_embed_to_m3u8(embed_url))
                    except Exception as re_err:
                        print(f"[Resolver Warning] Direct m3u8 resolution failed, falling back: {re_err}")
                        target_url = embed_url
                else:
                    raise Exception(res.get("error", "Failed to resolve stream link"))
                loop.close()
            except Exception as e:
                if req.download_id in active_downloads:
                    active_downloads[req.download_id]["status"] = "error"
                    active_downloads[req.download_id]["error"] = f"KissAnime resolver failed: {str(e)}"
                return

        elif req.source == "animetake":
            headers["Referer"] = "https://animetake.tv/"

        ydl_opts = {
            "format": get_format_selector(req.quality),
            "outtmpl": os.path.join(req.output_dir, f"{req.title} - {req.episode}.%(ext)s"),
            "progress_hooks": [progress_hook],
            "noplaylist": True,
            "quiet": True,
            "http_headers": headers,
            "nocheckcertificate": True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([target_url])
        except Exception as e:
            if req.download_id in active_downloads:
                active_downloads[req.download_id]["status"] = "error"
                active_downloads[req.download_id]["error"] = str(e)

    asyncio.get_event_loop().run_in_executor(None, run_download)
    return {"download_id": req.download_id, "status": "started"}

@router.get("/status/{download_id}")
async def get_status(download_id: str):
    return active_downloads.get(download_id, {"error": "Not found"})

@router.get("/all")
async def get_all():
    return list(active_downloads.values())

@router.delete("/{download_id}")
async def cancel_download(download_id: str):
    if download_id in active_downloads:
        active_downloads[download_id]["status"] = "cancelled"
    return {"status": "cancelled"}
