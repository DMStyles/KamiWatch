import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scrapers.anikoto import router as anikoto_router
from scrapers.animetake import router as animetake_router
from scrapers.kissanime import router as kissanime_router
from scrapers.schedule_api import router as schedule_router
from downloader import router as download_router
from library import router as library_router
from database import init_db

app = FastAPI(title="AniVault Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(anikoto_router, prefix="/anikoto", tags=["Anikoto"])
app.include_router(animetake_router, prefix="/animetake", tags=["AnimeTake"])
app.include_router(kissanime_router, prefix="/kissanime", tags=["Kissanime"])
app.include_router(schedule_router, prefix="/schedule", tags=["Schedule"])
app.include_router(download_router, prefix="/download", tags=["Download"])
app.include_router(library_router, prefix="/library", tags=["Library"])

@app.on_event("startup")
async def startup():
    init_db()
    print("AniVault backend started on http://localhost:8642")

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8642, log_level="info")
