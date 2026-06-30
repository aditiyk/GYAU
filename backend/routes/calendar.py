import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from core.security import get_current_user, UserContext
from db.database import get_db
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

logger = logging.getLogger(__name__)
router = APIRouter()

class CalendarConnectRequest(BaseModel):
    access_token: str

@router.post("/connect")
async def connect_calendar(request: CalendarConnectRequest, current_user: UserContext = Depends(get_current_user)):
    logger.info("Request received: POST /calendar/connect")
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection error")
        
    if current_user.user_id.startswith("guest_"):
        raise HTTPException(status_code=403, detail="Guests cannot sync cloud accounts")

    try:
        # Build credentials from the implicit access token
        creds = Credentials(token=request.access_token)
        service = build('calendar', 'v3', credentials=creds)

        # Call the Calendar API
        now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        # Get events for the next 7 days
        time_max = (datetime.utcnow() + timedelta(days=7)).isoformat() + 'Z'

        logger.info(f"Fetching calendar events for user {current_user.user_id} from {now} to {time_max}")
        events_result = service.events().list(
            calendarId='primary', timeMin=now, timeMax=time_max,
            singleEvents=True, orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        calendar_events = []
        for event in events:
            # Handle all-day events vs time-specific events
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            calendar_events.append({
                "title": event.get('summary', 'Busy'),
                "start_time": start,
                "end_time": end,
                "source": "google",
                "user_id": current_user.user_id
            })

        # Clear old events for this user and store new ones
        await db["calendar_events"].delete_many({"user_id": current_user.user_id})
        
        if calendar_events:
            await db["calendar_events"].insert_many(calendar_events)
            
        logger.info(f"Synced {len(calendar_events)} calendar events for user {current_user.user_id}")
        
        return {
            "success": True,
            "message": f"Synced {len(calendar_events)} events from Google Calendar"
        }

    except Exception as e:
        logger.error(f"Error fetching Google Calendar: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to sync calendar: {str(e)}")

@router.get("/events")
async def get_events(current_user: UserContext = Depends(get_current_user)):
    logger.info("Request received: GET /calendar/events")
    if current_user.user_id.startswith("guest_"):
        return []
    
    db = get_db()
    if db is None:
        return []
        
    try:
        events = await db["calendar_events"].find({"user_id": current_user.user_id}).to_list(100)
        # Clean ObjectIds for JSON serialization
        for e in events:
            if "_id" in e:
                e["_id"] = str(e["_id"])
        return events
    except Exception as e:
        logger.error(f"Error reading calendar events: {e}")
        return []
