import asyncio
from backend.scrapers.manga import mangadex_chapters

async def test():
    results = await mangadex_chapters("46e530ce-0766-4cbd-b005-5e6fb0ba5e71")
    print(results)

asyncio.run(test())
