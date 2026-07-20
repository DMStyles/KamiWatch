import asyncio
import httpx

async def test():
    params = {
        'title': 'one piece',
        'limit': 20,
        'contentRating[]': ['safe', 'suggestive', 'erotica'],
        'includes[]': ['cover_art'],
        'order[relevance]': 'desc'
    }
    async with httpx.AsyncClient() as client:
        r = await client.get('https://api.mangadex.org/manga', params=params)
        print(r.status_code)
        print(r.text[:200])

asyncio.run(test())
