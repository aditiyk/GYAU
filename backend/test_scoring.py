import asyncio
import logging
from datetime import datetime, timedelta
from bson import ObjectId
from db.database import connect_to_mongo, get_db
from planner.scheduler import auto_schedule_task

logging.basicConfig(level=logging.INFO)

async def test():
    await connect_to_mongo()
    db = get_db()
    
    # Delete test calendar_events
    await db["calendar_events"].delete_many({"user_id": "scoring_test_user"})

    # Test 1: Low Importance, Deadline in 5 days
    # Should schedule closer to deadline
    task1 = {
        "_id": ObjectId(), 
        "title": "Low Importance Task", 
        "estimated_hours": 1, 
        "deadline": (datetime.now() + timedelta(days=5)).isoformat(), 
        "importance": 1
    }
    await auto_schedule_task(task1, "scoring_test_user")

    # Test 2: High Importance, Deadline in 5 days
    # Should schedule closer to today
    task2 = {
        "_id": ObjectId(), 
        "title": "High Importance Task", 
        "estimated_hours": 1, 
        "deadline": (datetime.now() + timedelta(days=5)).isoformat(), 
        "importance": 5
    }
    await auto_schedule_task(task2, "scoring_test_user")

    print("\n--- TEST DONE ---")

asyncio.run(test())
