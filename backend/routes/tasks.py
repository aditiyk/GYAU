from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List
from db.models import Task
from db.database import get_db
from bson import ObjectId
from datetime import datetime
from analytics.task_mining import classify_task
from core.security import get_current_user, UserContext
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[Task])
async def get_tasks(current_user: UserContext = Depends(get_current_user)):
    logger.info("Request received: GET /tasks/")
    try:
        db = get_db()
        tasks = await db["tasks"].find({"user_id": current_user.user_id}).to_list(100)
        logger.info(f"DB Success: Retrieved {len(tasks)} tasks")
        return tasks
    except Exception as e:
        logger.error(f"DB Failure: Error fetching tasks - {str(e)}")
        return []

@router.post("/", response_model=Task)
async def create_task(task: Task = Body(...), current_user: UserContext = Depends(get_current_user)):
    logger.info(f"Request received: POST /tasks/ - Payload: {task.dict()}")
    try:
        db = get_db()
        task_dict = task.dict(by_alias=True, exclude={"id"})
        if not task_dict.get("category") or task_dict.get("category") == "Small":
            # Auto-classify if missing or default
            task_dict["category"] = classify_task(task_dict.get("title", ""))
            
        task_dict["created_at"] = datetime.utcnow()
        task_dict["user_id"] = current_user.user_id
        result = await db["tasks"].insert_one(task_dict)
        task.id = result.inserted_id
        
        # Trigger global batch scheduler
        from planner.batch_scheduler import schedule_tasks
        await schedule_tasks(current_user.user_id)
            
        logger.info(f"DB Success: Task inserted with id {task.id}")
        return task
    except Exception as e:
        import traceback
        with open("error_log.txt", "w") as f:
            f.write(traceback.format_exc())
        logger.error(f"DB Failure: Error inserting task - {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating task")

@router.patch("/{id}")
async def update_task(id: str, updates: dict = Body(...), current_user: UserContext = Depends(get_current_user)):
    logger.info(f"Request received: PATCH /tasks/{id} - Payload: {updates}")
    try:
        db = get_db()
        updates["edited_at"] = datetime.utcnow()
        if "completed" in updates:
            if updates["completed"]:
                updates["completed_at"] = datetime.utcnow()
            else:
                updates["completed_at"] = None
                
        await db["tasks"].update_one({"_id": ObjectId(id), "user_id": current_user.user_id}, {"$set": updates})
        logger.info(f"DB Success: Task {id} updated")
        return {"message": "Task updated"}
    except Exception as e:
        logger.error(f"DB Failure: Error updating task {id} - {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating task")

@router.delete("/{id}")
async def delete_task(id: str, current_user: UserContext = Depends(get_current_user)):
    logger.info(f"Request received: DELETE /tasks/{id}")
    try:
        db = get_db()
        await db["tasks"].delete_one({"_id": ObjectId(id), "user_id": current_user.user_id})
        logger.info(f"DB Success: Task {id} deleted")
        return {"message": "Task deleted"}
    except Exception as e:
        logger.error(f"DB Failure: Error deleting task {id} - {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting task")
