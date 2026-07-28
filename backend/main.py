import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scrapers.anikoto import router as anikoto_router
from scrapers.animetake import router as animetake_router
from scrapers.kissanime import router as kissanime_router
from scrapers.museasia import router as museasia_router
from scrapers.jikan import router as jikan_router
from scrapers.schedule_api import router as schedule_router
from downloader import router as download_router
from library import router as library_router
from database import init_db
from scrapers.manga import router as manga_router
from sync import router as sync_router

app = FastAPI(title="KamiWatch Backend", version="2.0.0")

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
app.include_router(museasia_router, prefix="/museasia", tags=["MuseAsia"])
app.include_router(jikan_router, prefix="/jikan", tags=["Jikan"])
app.include_router(schedule_router, prefix="/schedule", tags=["Schedule"])
app.include_router(download_router, prefix="/download", tags=["Download"])
app.include_router(library_router, prefix="/library", tags=["Library"])
app.include_router(manga_router, prefix="/manga", tags=["Manga"])
app.include_router(sync_router, prefix="/sync", tags=["Sync"])

@app.on_event("startup")
async def startup():
    init_db()
    print("KamiWatch backend started on http://localhost:8642")

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

from fastapi.responses import HTMLResponse

@app.get("/auth/callback", response_class=HTMLResponse)
async def auth_callback():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Sign-In Successful - KamiWatch</title>
        <meta charset="utf-8">
        <style>
            body {
                background-color: #07070f;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }
            .card {
                background: #121220;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px 32px;
                max-width: 400px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            }
            .icon { font-size: 54px; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 10px 0; color: #10b981; }
            p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }
            .btn {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                border: none;
                padding: 12px 24px;
                font-weight: bold;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">✨</div>
            <h1>Google Sign-In Successful!</h1>
            <p>Your Google Account has been authenticated. You can close this tab and return to KamiWatch.</p>
            <button class="btn" onclick="window.close()">Close Tab</button>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8642, log_level="info")
