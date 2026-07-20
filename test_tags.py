import asyncio, httpx, json

async def test():
    async with httpx.AsyncClient() as client:
        r = await client.get('https://api.mangadex.org/manga/tag')
        tags = r.json().get('data', [])
        mapping = {t['attributes']['name']['en']: t['id'] for t in tags if 'en' in t['attributes']['name']}
        print(json.dumps(mapping, indent=2))

asyncio.run(test())
