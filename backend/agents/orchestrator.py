from google import genai
from google.genai import types
from core.config import settings
from datetime import datetime
from prompts.orchestrator_prompt import ORCHESTRATOR_PROMPT_SYSTEM, ORCHESTRATOR_PROMPT_TEMPLATE
import json
import logging

logger = logging.getLogger(__name__)

if settings.gemini_api_key:
    client = genai.Client(api_key=settings.gemini_api_key)
else:
    client = None

async def orchestrate(context: dict) -> dict:
    if not client:
        return {
            "gayu_response": "Gayu is taking a nap! (API Key is not configured)",
            "planner_output": "None",
            "evaluator_output": "None",
            "final_action": "None"
        }

    # Extract info from context
    tasks = context.get("tasks", [])
    calendar = context.get("calendar", [])
    app_usage_logs = context.get("app_usage_logs", [])
    analytics_summary = context.get("analytics_summary", {})
    payments = context.get("payments", [])
    trigger_event = context.get("trigger_event", "Daily Check-in")
    focus_mode = context.get("focus_mode", "Inactive")
    current_time = context.get("current_time", datetime.now().isoformat())

    system_prompt = ORCHESTRATOR_PROMPT_SYSTEM.format(
        current_time=current_time,
        focus_mode=focus_mode,
        tasks=str(tasks),
        calendar=str(calendar),
        payments=str(payments),
        app_usage_logs=str(app_usage_logs),
        analytics_summary=str(analytics_summary)
    )

    prompt = ORCHESTRATOR_PROMPT_TEMPLATE.format(
        system_prompt=system_prompt,
        transcript=trigger_event
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        result = json.loads(response.text)
        return {
            "success": True,
            "gayu_response": result.get("gayu_response", "Hmph... whatever."),
            "planner_output": result.get("planner_output", ""),
            "evaluator_output": result.get("evaluator_output", ""),
            "final_action": result.get("final_action", ""),
            "new_tasks": result.get("new_tasks", [])
        }
    except Exception as e:
        error_str = str(e).lower()
        logger.error(f"Gemini API Error: {error_str}")
        if "429" in error_str or "quota" in error_str:
            return {
                "success": False,
                "error_type": "quota_exceeded",
                "message": "Temporary AI limit reached"
            }
        return {
            "success": False,
            "error_type": "unknown_error",
            "message": str(e)
        }
