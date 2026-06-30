from fastapi import APIRouter, UploadFile, File, Form, Depends
from core.security import get_current_user, UserContext
from agents.orchestrator import orchestrate
from db.database import get_db
from core.triggers import check_triggers
from core.config import settings
from google import genai
from google.genai import types
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/transcribe")
async def transcribe_voice(audio: UploadFile = File(...), current_user: UserContext = Depends(get_current_user)):
    logger.info(f"Request received: POST /voice/transcribe")
    transcribed_text = ""
    if getattr(audio, "file", None) is not None:
        try:
            if settings.gemini_api_key:
                client = genai.Client(api_key=settings.gemini_api_key)
                audio_bytes = await audio.read()
                if len(audio_bytes) > 0:
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[
                            "Transcribe this audio exactly as spoken. Do not add any extra commentary or formatting.",
                            types.Part.from_bytes(data=audio_bytes, mime_type=audio.content_type or "audio/webm")
                        ]
                    )
                    if response.text:
                        transcribed_text = response.text.strip()
                        logger.info(f"Gemini transcription successful: {transcribed_text}")
        except Exception as e:
            logger.error(f"Failed to transcribe audio with Gemini: {e}")
    
    if not transcribed_text:
        transcribed_text = "Sorry, I couldn't understand that."
        
    return {"transcription": transcribed_text}

@router.post("/process")
async def process_voice(
    text_prompt: str = Form("Remind me to pay Spotify tomorrow"),
    audio: UploadFile = File(None),
    current_user: UserContext = Depends(get_current_user)
):
    logger.info(f"Request received: POST /voice/process - Prompt: '{text_prompt}' - Audio: {audio is not None}")
    # 1. Speech-to-Text conversion
    transcribed_text = text_prompt
    if audio is not None and getattr(audio, "file", None) is not None:
        try:
            if settings.gemini_api_key:
                client = genai.Client(api_key=settings.gemini_api_key)
                audio_bytes = await audio.read()
                if len(audio_bytes) > 0:
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[
                            "Transcribe this audio exactly as spoken. Do not add any extra commentary or formatting.",
                            types.Part.from_bytes(data=audio_bytes, mime_type=audio.content_type or "audio/webm")
                        ]
                    )
                    if response.text:
                        transcribed_text = response.text.strip()
                        logger.info(f"Gemini transcription successful: {transcribed_text}")
        except Exception as e:
            logger.error(f"Failed to transcribe audio with Gemini: {e}")
    
    # 2. Pipeline transcribed text to Orchestrator
    db = get_db()
    tasks = []
    if db is not None:
        try:
            tasks = await db["tasks"].find({"user_id": current_user.user_id}).to_list(100)
            for t in tasks:
                if "_id" in t:
                    t["_id"] = str(t["_id"])
        except Exception as e:
            logger.error(f"DB Failure: Error fetching tasks in voice processing - {str(e)}")

    # Fetch real calendar events from planner_memory
    calendar = []
    if db is not None:
        try:
            imports_cursor = db.planner_memory.find({"active": True, "user_id": current_user.user_id})
            async for doc in imports_cursor:
                calendar.extend(doc.get("parsed_data", []))
        except Exception as e:
            logger.error(f"Error fetching planner memory: {e}")

    app_usage = []
    payments = []
    trigger_event = f"Voice command: '{transcribed_text}'"

    full_context = {
        "tasks": tasks,
        "calendar": calendar,
        "app_usage_logs": [],
        "payments": [],
        "analytics_summary": {},
        "trigger_event": trigger_event,
        "focus_mode": "Inactive"
    }

    try:
        agent_response = await orchestrate(full_context)
        logger.info(f"Full orchestrator response: {agent_response}")
        
        # Check for new tasks and insert them
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

        # Log agent execution to MongoDB
        if db is not None:
            try:
                await db["agent_logs"].insert_one({
                    "trigger_type": trigger_event,
                    "planner_output": agent_response.get("planner_output", ""),
                    "evaluator_output": agent_response.get("evaluator_output", ""),
                })
            except Exception as e:
                logger.error(f"Error logging agent execution: {e}")

        if not agent_response.get("gayu_response"):
            agent_response["gayu_response"] = "Hmph. My brain froze for a second. Try again."

        return {"agent_response": agent_response}
    except Exception as e:
        logger.error(f"Error in orchestrator: {e}")
        raise HTTPException(status_code=500, detail=str(e))