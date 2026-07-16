import sys
import os
import asyncio

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from scrapers.jikan import get_details

async def main():
    # Test details query for "Demon Slayer"
    r1 = await get_details(title="Demon Slayer")
    print("QUERY 'Demon Slayer':")
    print("Title:", r1.get("title"))
    print("ID:", r1.get("id"))
    
    # Test details query for "Kimetsu no Yaiba"
    r2 = await get_details(title="Kimetsu no Yaiba")
    print("\nQUERY 'Kimetsu no Yaiba':")
    print("Title:", r2.get("title"))
    print("ID:", r2.get("id"))

if __name__ == "__main__":
    asyncio.run(main())
