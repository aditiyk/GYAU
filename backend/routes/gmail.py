import logging
from fastapi import APIRouter, Depends
from core.security import get_current_user, UserContext

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/unread")
def get_unread_gmail(token: str = None, current_user: UserContext = Depends(get_current_user)):
    logger.info("Request received: GET /gmail/unread (Simulated OAuth)")
    from fastapi import HTTPException
    if current_user.user_id.startswith("guest_"):
        raise HTTPException(status_code=403, detail="Guests cannot sync cloud accounts")
    emails = [
        {"subject": "Action Required: Project Deliverables Due", "sender": "manager@company.com"},
        {"subject": "Your receipt from GitHub", "sender": "receipts@github.com"},
        {"subject": "Meeting rescheduled: Sync up", "sender": "colleague@company.com"},
        {"subject": "Weekly Newsletter", "sender": "newsletter@tech.com"},
        {"subject": "Security Alert: New login", "sender": "security@google.com"},
    ]
    logger.info(f"Success: Returned {len(emails)} unread emails")
    return {"unread_count": len(emails), "emails": emails}
