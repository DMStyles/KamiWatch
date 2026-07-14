import asyncio
import json
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import yt_dlp

router = APIRouter()

active_downloads = {}

class DownloadRequest(BaseModel):
    url: str
    title: str
    episode: str
    quality: Optional[str] = "best"
    output_dir: Optional[str] = os.path.expanduser("~/Downloads/AniVault")
    download_id: str

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
            dl["output_path"] = d.get("filename", "")

    def run_download():
        ydl_opts = {
            "format": get_format_selector(req.quality),
            "outtmpl": os.path.join(req.output_dir, f"{req.title} - {req.episode}.%(ext)s"),
            "progress_hooks": [progress_hook],
            "noplaylist": True,
            "quiet": True,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([req.url])
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
