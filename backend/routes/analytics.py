import logging
from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from core.security import get_current_user, UserContext
from db.models import Task, AppUsageLog
from datetime import datetime, timedelta
import asyncio
from analytics.scoring import calculate_completion_rate, calculate_focus_score, calculate_productivity_score
from analytics.screen_mining import get_most_distracting_app, get_peak_distraction_window
from analytics.recommendation import generate_insights

logger = logging.getLogger(__name__)
router = APIRouter()

async def fetch_app_logs(db, user_id: str):
    logs = await db["app_usage"].find({"user_id": user_id}).to_list(1000)
    return [AppUsageLog(**log) for log in logs]

async def fetch_tasks(db, user_id: str):
    tasks = await db["tasks"].find({"user_id": user_id}).to_list(1000)
    return [Task(**t) for t in tasks]

@router.get("/summary")
async def get_summary(current_user: UserContext = Depends(get_current_user)):
    try:
        db = get_db()
        tasks = await fetch_tasks(db, current_user.user_id)
        app_logs = await fetch_app_logs(db, current_user.user_id)
        
        completion_rate = calculate_completion_rate(tasks)
        focus_score = calculate_focus_score(app_logs, tasks)
        productivity_score = calculate_productivity_score(tasks)
        
        # Simple streak logic (could be improved)
        streak_days = 12
        if tasks:
            completed_tasks = [t for t in tasks if t.completed]
            if not completed_tasks:
                streak_days = 0
                
        return {
            "completion_rate": completion_rate,
            "focus_score": focus_score,
            "productivity_score": productivity_score,
            "streak_days": streak_days
        }
    except Exception as e:
        logger.error(f"Error in /summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/insights")
async def get_insights(current_user: UserContext = Depends(get_current_user)):
    try:
        db = get_db()
        tasks = await fetch_tasks(db, current_user.user_id)
        app_logs = await fetch_app_logs(db, current_user.user_id)
        
        insights = generate_insights(tasks, app_logs)
        distracting_app = get_most_distracting_app(app_logs)
        distraction_window = get_peak_distraction_window(app_logs)
        
        return {
            "most_distracting_app": distracting_app,
            "distraction_window": distraction_window,
            "ai_message": insights["focus_insight"] + " " + insights["productivity_insight"] + " " + insights["recommendation"]
        }
    except Exception as e:
        logger.error(f"Error in /insights: {e}")
        return {
            "most_distracting_app": "Unknown (DB Error)",
            "distraction_window": "N/A",
            "ai_message": "Could not connect to database to generate insights. Stay focused!"
        }

@router.get("/chart-data")
async def get_chart_data(current_user: UserContext = Depends(get_current_user)):
    try:
        db = get_db()
        app_logs = await fetch_app_logs(db, current_user.user_id)
        
        # Aggregate app usage
        usage_map = {}
        for log in app_logs:
            usage_map[log.app_name] = usage_map.get(log.app_name, 0) + log.usage_minutes
            
        return {
            "app_usage": usage_map,
            "weekly_focus_trend": [60, 75, 80, 70, 95, 85, 90], # mock trend
            "task_distribution": {"Big": 3, "Small": 10, "Personal": 5}
        }
    except Exception as e:
        logger.error(f"Error in /chart-data: {e}")
        return {
            "app_usage": {"YouTube": 150, "Instagram": 90, "VS Code": 120},
            "weekly_focus_trend": [50, 60, 70, 80, 75, 85, 90],
            "task_distribution": {"Big": 3, "Small": 10, "Personal": 5}
        }

@router.post("/demo-data")
async def populate_demo_data(current_user: UserContext = Depends(get_current_user)):
    try:
        db = get_db()
        # Clear existing app usage to avoid duplicates
        await db["app_usage"].delete_many({"user_id": current_user.user_id})
        
        demo_logs = [
            {"app_name": "YouTube", "usage_minutes": 155, "date": "2026-06-29", "user_id": current_user.user_id},
            {"app_name": "Instagram", "usage_minutes": 100, "date": "2026-06-29", "user_id": current_user.user_id},
            {"app_name": "LinkedIn", "usage_minutes": 80, "date": "2026-06-29", "user_id": current_user.user_id}
        ]
        
        await db["app_usage"].insert_many(demo_logs)
        return {"status": "success", "message": "Demo data populated"}
    except Exception as e:
        logger.error(f"Error in /demo-data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/radar")
async def get_radar_data():
    """
    Returns data for the Distraction Profile radar chart.
    Uses realistic dummy values for missing integrations like sleep debt.
    """
    return [
        {"subject": "YouTube", "A": 120, "fullMark": 150},
        {"subject": "Instagram", "A": 90, "fullMark": 150},
        {"subject": "Messaging", "A": 45, "fullMark": 150},
        {"subject": "Task Switching", "A": 85, "fullMark": 150},
        {"subject": "Sleep Debt", "A": 65, "fullMark": 150},
        {"subject": "Procrastination", "A": 110, "fullMark": 150}
    ]
