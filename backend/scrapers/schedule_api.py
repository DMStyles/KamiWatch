import httpx
from fastapi import APIRouter

router = APIRouter()

API_BASE = "https://animeschedule.net/api/v3"

@router.get("/timetables")
async def get_timetables(weeksAfter: int = 0):
    url = f"{API_BASE}/timetables?weeksAfter={weeksAfter}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
    if resp.status_code == 200:
        return resp.json()
    return {"error": "Failed to fetch schedule", "status": resp.status_code}

@router.get("/anime/{slug}")
async def get_anime(slug: str):
    url = f"{API_BASE}/anime/{slug}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
    if resp.status_code == 200:
        return resp.json()
    return {"error": "Not found", "status": resp.status_code}
