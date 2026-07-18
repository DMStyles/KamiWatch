from fastapi import APIRouter
from fastapi.responses import FileResponse
from database import get_library, get_follows, add_follow, get_config, set_config
from pydantic import BaseModel
import sqlite3
import os

class ConfigItem(BaseModel):
    key: str
    value: str

router = APIRouter()

@router.get("/config/{key}")
def get_configuration(key: str):
    return {"value": get_config(key)}

@router.post("/config")
def save_configuration(item: ConfigItem):
    set_config(item.key, item.value)
    return {"status": "ok"}

@router.get("")
def library():
    return get_library()

@router.get("/follows")
def follows():
    return get_follows()

@router.post("/follows")
def follow_show(title: str, url: str, thumbnail: str, source: str):
    add_follow(title, url, thumbnail, source)
    return {"status": "ok"}

@router.delete("/follows/{id}")
def unfollow_show(id: int):
    from database import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM follows WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}

@router.get("/stream")
def stream_file(path: str):
    if os.path.exists(path):
        return FileResponse(path)
    return {"error": "File not found"}
