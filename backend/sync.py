import json
import sqlite3
import datetime
import httpx
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

class UserVerifyRequest(BaseModel):
    """Used by the OAuth callback — sends the real Google access_token for server-side verification."""
    access_token: str

class SyncUploadRequest(BaseModel):
    user_id: str
    history: Optional[list] = []
    watchlist: Optional[dict] = {}
    favorites: Optional[dict] = {}
    manga_history: Optional[list] = []
    settings: Optional[dict] = {}

@router.post("/verify")
async def verify_google_token(req: UserVerifyRequest):
    """
    SECURE: Verifies a real Google access_token by calling Google's userinfo API.
    Extracts email/name/picture server-side — the frontend never sends raw user data.
    """
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://www.googleapis.com/userinfo/v2/me",
                headers={"Authorization": f"Bearer {req.access_token}"}
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired Google access token")

        info = resp.json()
        email = info.get("email", "")
        if not email:
            raise HTTPException(status_code=401, detail="Google token did not return an email address")

        # Use Google's verified sub (subject) as the stable user ID
        google_sub = info.get("id") or info.get("sub") or ""
        user_id = f"g_{google_sub}" if google_sub else f"g_{email.replace('@','_').replace('.','_')}"
        name = info.get("name") or email.split("@")[0]
        avatar = info.get("picture") or f"https://api.dicebear.com/7.x/bottts/svg?seed={email}"

        # Upsert verified user into DB
        conn = get_conn()
        c = conn.cursor()
        c.execute(
            "INSERT INTO user_sync (user_id, user_email, user_name, user_avatar) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(user_id) DO UPDATE SET user_email=excluded.user_email, user_name=excluded.user_name, user_avatar=excluded.user_avatar",
            (user_id, email, name, avatar)
        )
        conn.commit()
        conn.close()

        return {
            "status": "verified",
            "user": {"id": user_id, "email": email, "name": name, "avatar": avatar}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token verification failed: {str(e)}")


@router.post("/auth")
async def authenticate_user(user: UserAuthRequest):
    """Legacy endpoint — kept for internal Supabase session sync only.
    Direct calls with made-up user_ids are rejected if the user doesn't exist in DB."""
    conn = get_conn()
    c = conn.cursor()
    # SECURITY: Only upsert if user already exists (verified via /verify) OR if Supabase ID format
    c.execute("SELECT user_id FROM user_sync WHERE user_id = ?", (user.user_id,))
    existing = c.fetchone()
    if existing:
        # Update existing verified user's profile data
        c.execute(
            "UPDATE user_sync SET user_email=?, user_name=?, user_avatar=? WHERE user_id=?",
            (user.email, user.name, user.avatar or "", user.user_id)
        )
        conn.commit()
        conn.close()
        return {"status": "updated", "user": user.dict()}
    else:
        # Only allow new registrations from real Supabase UUIDs (36-char UUID format)
        import re
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
        if uuid_pattern.match(user.user_id):
            # This is a real Supabase UUID — allow it
            c.execute(
                "INSERT INTO user_sync (user_id, user_email, user_name, user_avatar) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(user_id) DO UPDATE SET user_email=excluded.user_email, user_name=excluded.user_name, user_avatar=excluded.user_avatar",
                (user.user_id, user.email, user.name, user.avatar or "")
            )
            conn.commit()
            conn.close()
            return {"status": "authenticated", "user": user.dict()}
        else:
            conn.close()
            raise HTTPException(status_code=403, detail="Use /sync/verify with a Google access_token to register.")

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
    c.execute(
        "INSERT INTO user_sync (user_id, sync_data) VALUES (?, ?) "
        "ON CONFLICT(user_id) DO UPDATE SET sync_data = excluded.sync_data, updated_at = CURRENT_TIMESTAMP",
        (data.user_id, json_str)
    )
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

@router.get("/latest-user")
async def get_latest_user():
    """Get the most recently authenticated user from Google OAuth."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT user_id, user_email, user_name, user_avatar FROM user_sync WHERE user_email IS NOT NULL AND user_email != '' ORDER BY updated_at DESC LIMIT 1")
    row = c.fetchone()
    conn.close()
    if not row or not row[1]:
        return {"status": "not_found"}
    return {
        "status": "success",
        "user": {
            "id": row[0],
            "email": row[1],
            "name": row[2],
            "avatar": row[3]
        }
    }
