import httpx
import asyncio

async def test():
    client = httpx.AsyncClient(headers={"User-Agent": "KamiWatch/2.0.0"})
    r = await client.get('https://api.mangadex.org/manga', params={'title': 'berserk'})
    items = r.json().get('data', [])
    if not items:
        print("No manga found")
        return
    id_ = items[0]['id']
    print("Manga ID:", id_)
    
    r2 = await client.get('https://api.mangadex.org/chapter', params={'manga': id_, 'limit': 1, 'translatedLanguage[]': ['en']})
    chapters = r2.json().get('data', [])
    if not chapters:
        print("No chapters found")
        return
    ch_id = chapters[0]['id']
    print("Chapter ID:", ch_id)
    
    r3 = await client.get(f'https://api.mangadex.org/at-home/server/{ch_id}')
    data = r3.json()
    print("At-Home Data:", data)
    
    base = data.get("baseUrl")
    ch = data.get("chapter", {})
    hash_ = ch.get("hash")
    files = ch.get("data", [])
    
    if files:
        img_url = f"{base}/data/{hash_}/{files[0]}"
        print("Test Image URL:", img_url)
        img_r = await client.get(img_url)
        print("Image Status:", img_r.status_code)

asyncio.run(test())
