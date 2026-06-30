import asyncio
import dateutil.parser
from datetime import datetime, timedelta
from bson import ObjectId
from db.database import connect_to_mongo, get_db
from planner.scheduler import auto_schedule_task

async def test():
    await connect_to_mongo()
    task = {"_id": ObjectId(), "title": "Have dinner", "estimated_hours": 1, "deadline": "2026-06-30T22:33", "importance": 2}
    try:
        await auto_schedule_task(task, "test_user")
        print("Done")
    except Exception as e:
        print(f"Exception: {repr(e)}")

asyncio.run(test())
