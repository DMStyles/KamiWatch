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
    allow_origins=["*"],
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
                max-width: 420px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            }
            .icon { font-size: 54px; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 10px 0; color: #10b981; }
            p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px; }
            .user-box {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 10px;
                padding: 10px;
                font-size: 13px;
                font-weight: 600;
                color: #60a5fa;
                margin-bottom: 24px;
                word-break: break-all;
            }
            .btn {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                border: none;
                padding: 12px 28px;
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
            <p>Your Google Account has been authenticated and linked to KamiWatch.</p>
            <div id="user-box" class="user-box">Syncing account profile...</div>
            <button class="btn" onclick="window.close()">Close Tab & Return to App</button>
        </div>
        <script>
            window.onload = async function() {
                try {
                    const hash = window.location.hash || '';
                    const search = window.location.search || '';
                    const params = new URLSearchParams((hash ? hash.replace('#', '?') : search));
                    const accessToken = params.get('access_token');

                    let email = '';
                    let name = '';

                    if (accessToken) {
                        try {
                            const payloadBase64 = accessToken.split('.')[1];
                            const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                            }).join(''));
                            const decoded = JSON.parse(jsonPayload);
                            email = decoded.email || decoded.user_metadata?.email || '';
                            name = decoded.user_metadata?.full_name || decoded.name || (email ? email.split('@')[0] : 'User');
                        } catch (e) {
                            console.error('Failed to parse access token', e);
                        }
                    }

                    if (email) {
                        document.getElementById('user-box').innerText = 'Signed in as: ' + email;
                        const googleId = 'g_' + btoa(email.toLowerCase()).replace(/=/g, '');
                        const avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(email);

                        await fetch('/sync/auth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                user_id: googleId,
                                email: email,
                                name: name,
                                avatar: avatar
                            })
                        });
                    } else {
                        document.getElementById('user-box').innerText = 'Account connected!';
                    }
                } catch (err) {
                    console.error('Auth callback error', err);
                    document.getElementById('user-box').innerText = 'Account connected!';
                }
            };
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8642, log_level="info")
