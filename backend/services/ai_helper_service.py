import json
import logging
from google import genai
from google.genai import types
from core.config import settings

logger = logging.getLogger(__name__)

async def run_ai_helper(helper_type: str, payload: dict) -> dict:
    if not settings.gemini_api_key:
        return {"error": "Gemini API key is not configured"}
        
    client = genai.Client(api_key=settings.gemini_api_key)
    
    try:
        if helper_type == "break_task":
            description = payload.get("description", "")
            prompt = f"""Break down this task into subtasks: '{description}'
            Return ONLY a valid JSON array of objects.
            Each object must have 'title' (string) and 'estimated_hours' (number).
            Example: [{{"title": "Research", "estimated_hours": 1}}]
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            subtasks = json.loads(text)
            return {"subtasks": subtasks}
            
        elif helper_type == "plan_day":
            priorities = payload.get("priorities", "")
            hours = payload.get("availableHours", "8")
            deadlines = payload.get("deadlines", "")
            
            prompt = f"""Act as Gayu, a highly productive but slightly tsundere AI planner.
            The user wants to plan their day.
            Priorities: {priorities}
            Available Hours: {hours}
            Deadlines: {deadlines}
            
            Create a response with a brief, slightly bossy but encouraging plan.
            Output ONLY valid JSON like:
            {{
                "gayu_response": "Here's your plan, don't mess it up...",
                "suggested_task_order": ["Task 1", "Task 2"]
            }}
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            return json.loads(text)
            
        elif helper_type == "revision_plan":
            exam_date = payload.get("examDate", "")
            subjects = payload.get("subjects", "")
            daily_hours = payload.get("dailyHours", "3")
            
            prompt = f"""Create a spaced-repetition revision plan.
            Exam Date: {exam_date}
            Subjects: {subjects}
            Daily Hours: {daily_hours}
            
            Return ONLY valid JSON in this format:
            {{
                "daily_plan": ["Day 1: ...", "Day 2: ..."],
                "revision_cycles": ["Cycle 1: ..."],
                "mock_test_days": ["Day X: Mock test"]
            }}
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            return json.loads(text)
            
        elif helper_type == "study":
            text_prompt = payload.get("text", "")
            prompt = f"""Act as Gayu, a highly intelligent but playfully tsundere tutor.
            The user is studying and asking for help.
            Explain concepts clearly, quiz the user if appropriate, and maintain your tsundere persona.
            
            User's prompt: {text_prompt}
            """
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return {"response": response.text.strip()}
            
        else:
            return {"error": "Unknown helper type"}
            
    except Exception as e:
        logger.error(f"Error in run_ai_helper: {e}")
        return {"error": str(e)}
