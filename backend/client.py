import httpx

# Browser-like User-Agent so AniList CDN doesn't block requests with 403
_DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, */*",
}

# Cache the original httpx.AsyncClient to prevent circular monkey-patching bugs
OriginalAsyncClient = httpx.AsyncClient

client = OriginalAsyncClient(
    timeout=15,
    headers=_DEFAULT_HEADERS,
    limits=httpx.Limits(max_keepalive_connections=20, max_connections=50)
)

class SharedClientContext:
    def __init__(self, *args, **kwargs):
        # Merge caller-supplied headers on top of our defaults
        self.headers = {**_DEFAULT_HEADERS, **kwargs.get("headers", {})}
        
    async def __aenter__(self):
        # Apply merged headers to the shared client for this context block
        client.headers.update(self.headers)
        return client
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Restore default headers after the context exits
        client.headers.update(_DEFAULT_HEADERS)
