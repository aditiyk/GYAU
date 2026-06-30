from fastapi import APIRouter, Depends, Body, Form
from core.security import get_current_user, UserContext
from services.ai_helper_service import run_ai_helper
from db.database import get_db
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/study")
async def study_with_gayu(
    text_prompt: str = Form(...),
    current_user: UserContext = Depends(get_current_user)
):
    logger.info(f"AI Helper: study for user {current_user.user_id}")
    return await run_ai_helper("study", {"text": text_prompt})

@router.post("/break-task")
async def break_task(
    payload: dict = Body(...),
    current_user: UserContext = Depends(get_current_user)
):
    logger.info(f"AI Helper: break-task for user {current_user.user_id}")
    return await run_ai_helper("break_task", payload)

@router.post("/plan-day")
async def plan_day(
    payload: dict = Body(...),
    current_user: UserContext = Depends(get_current_user)
):
    logger.info(f"AI Helper: plan-day for user {current_user.user_id}")
    return await run_ai_helper("plan_day", payload)

@router.post("/revision-plan")
async def revision_plan(
    payload: dict = Body(...),
    current_user: UserContext = Depends(get_current_user)
):
    logger.info(f"AI Helper: revision-plan for user {current_user.user_id}")
    return await run_ai_helper("revision_plan", payload)

@router.post("/prioritize")
async def prioritize_tasks(
    current_user: UserContext = Depends(get_current_user)
):
    logger.info(f"AI Helper: prioritize for user {current_user.user_id}")
    db = get_db()
    if db is None:
        return {"error": "Database not available"}
        
    tasks = await db["tasks"].find({"user_id": current_user.user_id, "completed": False}).to_list(100)
    
    # Python-only prioritization logic
    for task in tasks:
        # Example mapping (should align with actual model fields)
        deadline_urgency = 10 if task.get("deadline") else 0
        importance = 10 if task.get("priority") == "High" else 5
        effort = task.get("duration", 30) / 60.0
        context_match = 5
        
        priority_score = (deadline_urgency * 0.4) + (importance * 0.3) + (effort * 0.1) + (context_match * 0.2)
        
        if priority_score >= 7:
            label = "High"
        elif priority_score >= 4:
            label = "Medium"
        else:
            label = "Low"
            
        task["priority_score"] = priority_score
        task["priority_label"] = label
        
        await db["tasks"].update_one(
            {"_id": task["_id"]},
            {"$set": {"priority_score": priority_score, "priority_label": label}}
        )
        task["_id"] = str(task["_id"])
        
    tasks.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
    return {"tasks": tasks}
