import asyncio, httpx

async def test():
    params = {'manga': '46e530ce-0766-4cbd-b005-5e6fb0ba5e71'}
    headers = {"User-Agent": "KamiWatch/2.0.0"}
    async with httpx.AsyncClient() as client:
        r = await client.get('https://api.mangadex.org/chapter', params=params, headers=headers)
        print("Status:", r.status_code)
        print("Response:", r.text[:200])

asyncio.run(test())
