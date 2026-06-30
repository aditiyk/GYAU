from fastapi import APIRouter, Body, Depends
from agents.orchestrator import orchestrate
from db.database import get_db
from core.security import get_current_user, UserContext
from core.triggers import check_triggers

import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/orchestrate")
async def orchestrate_agent(context: dict = Body(default={}), current_user: UserContext = Depends(get_current_user)):
    logger.info(f"Request received: POST /agent/orchestrate - Payload: {context}")
    db = get_db()
    
    # 1. Fetch current tasks from DB for the specific user
    tasks = []
    if db is not None:
        try:
            tasks = await db["tasks"].find({"user_id": current_user.user_id}).to_list(100)
            # convert ObjectIds to string
            for t in tasks:
                if "_id" in t:
                    t["_id"] = str(t["_id"])
        except Exception as e:
            logger.error(f"DB Failure: Error fetching tasks in orchestrator - {str(e)}")

    # 2. Get real calendar events from planner_memory
    calendar = []
    if db is not None:
        try:
            imports_cursor = db.planner_memory.find({"active": True, "user_id": current_user.user_id})
            async for doc in imports_cursor:
                calendar.extend(doc.get("parsed_data", []))
        except Exception as e:
            logger.error(f"Error fetching planner memory: {e}")

    # No more mock payments/app usage
    app_usage = []
    payments = []

    # 3. Check trigger
    trigger_event = check_triggers(tasks, payments, app_usage)
    logger.info(f"Trigger check complete: {trigger_event}")

    # 4. Assemble orchestrator context
    full_context = {
        "tasks": tasks,
        "calendar": calendar,
        "app_usage_logs": [],
        "payments": [],
        "analytics_summary": {},
        "trigger_event": trigger_event,
        "focus_mode": context.get("focus_mode", "Inactive"),
        "current_time": context.get("current_time", "")
    }

    # 5. Call Orchestrator
    try:
        agent_response = await orchestrate(full_context)
        
        # 6. Check for new tasks and insert them
        new_tasks = agent_response.get("new_tasks", [])
        if new_tasks and db is not None:
            for task in new_tasks:
                task["user_id"] = current_user.user_id
                task["completed"] = False
            try:
                await db["tasks"].insert_many(new_tasks)
                # Clean up ObjectIds for JSON serialization
                for task in new_tasks:
                    if "_id" in task:
                        task["_id"] = str(task["_id"])
            except Exception as e:
                logger.error(f"Error inserting new tasks: {e}")
        # 7. Log agent execution to MongoDB
        if db is not None:
            try:
                await db["agent_logs"].insert_one({
                    "trigger_type": trigger_event,
                    "planner_output": agent_response.get("planner_output", ""),
                    "evaluator_output": agent_response.get("evaluator_output", ""),
                    "final_action": agent_response.get("final_action", ""),
                    "gayu_response": agent_response.get("gayu_response", "")
                })
                logger.info("DB Success: Agent log inserted")
            except Exception as e:
                logger.error(f"DB Failure: Error inserting agent log - {str(e)}")

        return {
            "success": True,
            "agent_response": agent_response
        }
    except Exception as e:
        logger.error(f"Orchestration error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

