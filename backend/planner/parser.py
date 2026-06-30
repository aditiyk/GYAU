from google import genai
from google.genai import types
from core.config import settings
import json
import logging

logger = logging.getLogger(__name__)

if settings.gemini_api_key:
    client = genai.Client(api_key=settings.gemini_api_key)
else:
    client = None

def parse_image_timetable(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """Uses Gemini Vision to extract tasks from an image."""
    if not client:
        logger.warning("No Gemini API key for image parsing.")
        return {"success": False, "tasks": [], "error": "Could not detect a valid timetable."}

    try:
        prompt = '''
        You are an OCR extraction engine.

        Read ONLY text visibly present in the uploaded timetable image.

        Rules:
        1. NEVER invent class names, subjects, timings, or days.
        2. If text is unreadable, return an empty list.
        3. Do NOT use placeholder examples like "Math 101", "Physics", "Study Group".
        4. Only extract entries with:
           - day
           - title
           - start_time
           - end_time

        Output pure JSON only.
        If fewer than 3 timetable entries are confidently readable, return:
        []
        '''
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
             raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
             raw_text = raw_text[3:-3].strip()
             
        parsed = json.loads(raw_text)
        
        if isinstance(parsed, list):
             valid_tasks = [t for t in parsed if isinstance(t, dict) and all(k in t for k in ('title', 'day', 'start_time', 'end_time'))]
             if len(valid_tasks) < 1:
                 return {"success": False, "tasks": [], "error": "Could not detect any valid timetable entries."}
             return {"success": True, "tasks": valid_tasks}
        return {"success": False, "tasks": [], "error": "Could not parse JSON from Gemini."}
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error parsing image in parse_image_timetable: {error_msg}", exc_info=True)
        
        # TODO: Implement local OCR fallback using EasyOCR or Tesseract when Gemini fails or quota is exhausted.
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {
                "success": False,
                "tasks": [],
                "error": "Gemini API quota exceeded. Please wait a few minutes or upload Excel/CSV instead."
            }

        return {
            "success": False,
            "tasks": [],
            "error": "Could not detect a valid timetable due to an internal parser error."
        }

def parse_csv_timetable(csv_text: str) -> list:
    """Uses Gemini to structure CSV contents into Tasks."""
    if not client:
        logger.warning("No Gemini API key for CSV parsing.")
        return []

    try:
        prompt = f'''
        Extract tasks from the following CSV timetable data:
        {csv_text}
        
        Detect day headers and time columns.
        Return a JSON array of objects, each representing a scheduled block or task containing:
        - "title": the name of the task/class
        - "category": classify as "Class", "Study", "Break", "Big", "Small", or "Personal"
        - "day": e.g., "Mon", "Tue" (if fixed day, otherwise null)
        - "start_time": e.g., "08:00 AM" (if fixed time, otherwise null)
        - "end_time": e.g., "09:00 AM" (if fixed time, otherwise null)
        - "duration_minutes": estimated duration (default 60 if unknown)
        
        CRITICAL RULES:
        1. DO NOT return column headers or day names (e.g. "Mon", "Tue", "Wed") as individual tasks.
        2. DO NOT return time slots (e.g. "8:00 AM", "9:00 AM") as tasks.
        3. Ignore empty cells.
        4. If a class spans multiple time slots, infer the duration from the row span.
        '''
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
        return []
