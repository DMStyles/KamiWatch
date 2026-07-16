import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

async def main():
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get("https://anikototv.to/home")
    soup = BeautifulSoup(resp.text, "html.parser")
    print("PAGE TITLE:", soup.title.string if soup.title else "None")
    
    # Try selecting some elements
    print("ani items len:", len(soup.select(".ani.items .item")))
    print("film-poster len:", len(soup.select(".film-poster")))
    print("item len:", len(soup.select(".item")))
    
    # Let's inspect the first few items to see what classes and attributes they have
    for i, item in enumerate(soup.select(".ani.items .item")[:5]):
        print(f"\nITEM {i}:")
        print(str(item)[:1000])

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
