import asyncio
from backend.scrapers.manga import mangadex_search

async def test():
    results = await mangadex_search("one piece")
    print(results)

asyncio.run(test())
