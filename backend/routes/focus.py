import logging
from fastapi import APIRouter, Depends
from core.security import get_current_user, UserContext

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start")
def start_focus(current_user: UserContext = Depends(get_current_user)): 
    logger.info("Request received: POST /focus/start")
    logger.info("Success: Focus mode started")
    return {"status": "Focus started"}

@router.post("/stop")
def stop_focus(current_user: UserContext = Depends(get_current_user)): 
    logger.info("Request received: POST /focus/stop")
    logger.info("Success: Focus mode stopped")
    return {"status": "Focus stopped"}
