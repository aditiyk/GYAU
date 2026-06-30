import asyncio
from db.database import connect_to_mongo, get_db

async def test():
    await connect_to_mongo()
    db = get_db()
    events = await db["calendar_events"].find({"title": "Have dinner"}).to_list(None)
    print("Found events:", len(events))
    for e in events:
        print(e)
    
asyncio.run(test())
