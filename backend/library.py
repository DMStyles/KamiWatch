from fastapi import APIRouter
from database import get_library, get_follows, add_follow
import sqlite3

router = APIRouter()

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
