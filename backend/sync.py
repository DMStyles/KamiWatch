import json
import sqlite3
import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from database import get_conn

router = APIRouter()

class UserAuthRequest(BaseModel):
    user_id: str
    email: str
    name: str
    avatar: Optional[str] = ""

class SyncUploadRequest(BaseModel):
    user_id: str
    history: Optional[list] = []
    watchlist: Optional[dict] = {}
    favorites: Optional[dict] = {}
    manga_history: Optional[list] = []
    settings: Optional[dict] = {}

@router.post("/auth")
async def authenticate_user(user: UserAuthRequest):
    """Register or update user Google Profile in backend sync DB."""
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO user_sync (user_id, user_email, user_name, user_avatar) VALUES (?, ?, ?, ?) "
        "ON CONFLICT(user_id) DO UPDATE SET user_email=excluded.user_email, user_name=excluded.user_name, user_avatar=excluded.user_avatar",
        (user.user_id, user.email, user.name, user.avatar or "")
    )
    conn.commit()
    conn.close()
    return {"status": "authenticated", "user": user.dict()}

@router.post("/upload")
async def upload_user_sync_data(data: SyncUploadRequest):
    """Upload and merge user history, watchlist, favorites, manga history, and settings to cloud sync store."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT sync_data FROM user_sync WHERE user_id = ?", (data.user_id,))
    row = c.fetchone()
    
    existing = {}
    if row and row[0]:
        try:
            existing = json.loads(row[0])
        except Exception:
            existing = {}

    merged_data = {
        "history": data.history if data.history else existing.get("history", []),
        "watchlist": data.watchlist if data.watchlist else existing.get("watchlist", {}),
        "favorites": data.favorites if data.favorites else existing.get("favorites", {}),
        "manga_history": data.manga_history if data.manga_history else existing.get("manga_history", []),
        "settings": data.settings if data.settings else existing.get("settings", {}),
        "last_synced": datetime.datetime.utcnow().isoformat()
    }

    json_str = json.dumps(merged_data)
    c.execute("UPDATE user_sync SET sync_data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", (json_str, data.user_id))
    conn.commit()
    conn.close()
    return {"status": "synced", "last_synced": merged_data["last_synced"]}

@router.get("/download")
async def download_user_sync_data(user_id: str):
    """Download user's cloud sync data."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT sync_data, user_email, user_name, user_avatar FROM user_sync WHERE user_id = ?", (user_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        return {"status": "not_found", "sync_data": {}}

    sync_data = {}
    if row[0]:
        try:
            sync_data = json.loads(row[0])
        except Exception:
            pass

    return {
        "status": "success",
        "user": {"email": row[1], "name": row[2], "avatar": row[3]},
        "sync_data": sync_data
    }
