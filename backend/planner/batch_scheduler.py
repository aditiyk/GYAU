import logging
from datetime import datetime, timedelta
import dateutil.parser

logger = logging.getLogger(__name__)

def parse_iso_datetime(dt_str):
    if not dt_str: return None
    if isinstance(dt_str, datetime): return dt_str.replace(tzinfo=None)
    try:
        return datetime.fromisoformat(str(dt_str).replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        try:
            return dateutil.parser.parse(str(dt_str)).replace(tzinfo=None)
        except:
            return None

async def schedule_tasks(user_id: str):
    """
    Global Batch Scheduler
    Pulls all tasks, planner memory, and calendar events for the user.
    Locks tasks within 24 hours, Google Calendar, and Imported Timetables.
    Re-schedules all other flexible tasks intelligently.
    """
    from db.database import get_db
    db = get_db()
    now = datetime.now()

    # 1. Fetch data
    tasks = await db["tasks"].find({"user_id": user_id, "completed": False}).to_list(None)
    events = await db["calendar_events"].find({"user_id": user_id}).to_list(None)
    
    # We also need imported timetables to map to absolute dates and lock them
    imports = await db.planner_memory.find({"user_id": user_id, "active": True}).to_list(None)
    
    busy_slots = []
    events_to_delete = []
    
    # 2. Process existing calendar events
    for ev in events:
        source = ev.get("source")
        st = parse_iso_datetime(ev.get("start_time"))
        et = parse_iso_datetime(ev.get("end_time"))
        if not st or not et:
            continue
            
        if source == "google":
            busy_slots.append({"start": st, "end": et, "type": "google"})
        elif source == "gyau":
            # AI-scheduled tasks starting within next 24 hours are locked
            if st < now + timedelta(hours=24):
                busy_slots.append({"start": st, "end": et, "type": "gyau_locked"})
            else:
                events_to_delete.append(ev["_id"])
        else:
            busy_slots.append({"start": st, "end": et, "type": "other"})
            
    # 3. Process imported timetable classes (Lock them for the next 14 days)
    days_map = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}
    today_weekday = now.weekday()
    
    fixed_task_titles = set()
    for imp in imports:
        raw_tasks = imp.get("parsed_data", [])
        for rt in raw_tasks:
            d_name = str(rt.get("day", "")).strip()[:3].capitalize()
            if d_name in days_map:
                fixed_task_titles.add(rt.get("title", ""))
                target_weekday = days_map[d_name]
                days_ahead = (target_weekday - today_weekday) % 7
                
                # Lock for this week and next week
                for week_offset in [0, 1]:
                    target_date = now + timedelta(days=days_ahead + (week_offset * 7))
                    try:
                        st_time = dateutil.parser.parse(str(rt.get("start_time"))).time()
                        st = target_date.replace(hour=st_time.hour, minute=st_time.minute, second=0, microsecond=0)
                        duration = int(rt.get("duration_minutes", 60))
                        et = st + timedelta(minutes=duration)
                        busy_slots.append({"start": st, "end": et, "type": "imported"})
                    except:
                        pass

    # 4. Filter flexible tasks to be scheduled
    # Flexible tasks are those NOT in fixed_task_titles and NOT having fixed_or_flexible=="Fixed"
    flexible_tasks = []
    for t in tasks:
        if t.get("fixed_or_flexible") == "Fixed" or t.get("title") in fixed_task_titles:
            # It's a pinned/fixed task. If it has a deadline or date, lock it (not implemented fully here, but we ignore it for flexible scheduling)
            continue
            
        # Is this task already locked in busy_slots? (i.e. starts within 24h)
        task_id_str = str(t.get("_id") or t.get("id"))
        is_locked = False
        for ev in events:
            if ev.get("task_id") == task_id_str and parse_iso_datetime(ev.get("start_time", now)) < now + timedelta(hours=24):
                is_locked = True
                break
                
        if not is_locked:
            flexible_tasks.append(t)
            
    if not flexible_tasks:
        logger.info("No flexible tasks to schedule.")
        # We still delete the old flexible events that were > 24h
        if events_to_delete:
            await db["calendar_events"].delete_many({"_id": {"$in": events_to_delete}})
        return
        
    # Sort busy slots to compute free gaps
    busy_slots.sort(key=lambda x: x["start"])
    
    # 5. Generate all global free slots for the next 14 days
    pref_start_hour = 17
    pref_end_hour = 23
    
    search_end_date = now + timedelta(days=14)
    free_slots = []
    
    current_time = now
    while current_time < search_end_date:
        if current_time.hour < pref_start_hour:
            current_time = current_time.replace(hour=pref_start_hour, minute=0, second=0, microsecond=0)
        elif current_time.hour >= pref_end_hour:
            current_time = (current_time + timedelta(days=1)).replace(hour=pref_start_hour, minute=0, second=0, microsecond=0)
            continue
            
        max_end_today = current_time.replace(hour=pref_end_hour, minute=0, second=0, microsecond=0)
        
        overlap = False
        for b in busy_slots:
            if current_time >= b["start"] and current_time < b["end"]:
                current_time = b["end"]
                overlap = True
                break
            
            if b["start"] > current_time and b["start"] < max_end_today:
                max_end_today = b["start"]
                
        if overlap:
            continue
            
        gap_duration = (max_end_today - current_time).total_seconds() / 60
        
        if gap_duration >= 15:
            free_slots.append({
                "start": current_time,
                "end": max_end_today,
                "duration": gap_duration
            })
            current_time = max_end_today
        else:
            current_time = max_end_today

    if not free_slots:
        logger.info("No free slots found globally.")
        return
        
    logger.info(f"--- BATCH SCHEDULER DEBUG ---")
    logger.info(f"Found {len(free_slots)} global free slots.")

    # 6. Score and Place all flexible tasks
    schedule_blocks = []
    
    # To prioritize which task gets to pick slots first, sort tasks by deadline
    # so tasks with closer deadlines get first pick at their highest scoring slots.
    def get_task_deadline(t):
        dl = parse_iso_datetime(t.get("deadline"))
        return dl if dl else search_end_date
        
    flexible_tasks.sort(key=lambda x: get_task_deadline(x))
    
    for task in flexible_tasks:
        deadline = get_task_deadline(task)
        duration_mins = int(float(task.get("estimated_hours", 1.0)) * 60)
        importance = int(task.get("importance", 3))
        title = str(task.get("title", "")).lower()
        
        # Semantic mapping
        is_breakfast = "breakfast" in title
        is_workout = any(k in title for k in ["workout", "walk", "run", "gym"])
        is_study = any(k in title for k in ["study", "revision", "homework", "assignment"])
        
        total_time_window = max((deadline - now).total_seconds(), 1.0)
        
        scored_slots = []
        for slot in free_slots:
            if slot["duration"] <= 0:
                continue
                
            slot_start = slot["start"]
            if slot_start >= deadline:
                continue # cannot schedule after deadline
                
            time_from_now = max((slot_start - now).total_seconds(), 0.0)
            
            # Urgency scoring
            if importance >= 4:
                urgency = max(0.0, 1.0 - (time_from_now / total_time_window))
            else:
                urgency = min(1.0, time_from_now / total_time_window)
                
            importance_score = importance / 5.0
            diff = abs(slot["duration"] - duration_mins)
            slot_fit = max(0.0, 1.0 - (diff / max(1.0, float(duration_mins))))
            
            # Context scoring based on semantics
            context = 0.5
            hour = slot_start.hour
            if is_breakfast:
                if 6 <= hour <= 10: context = 1.0
                else: context = 0.0
            elif is_workout:
                if 17 <= hour <= 21: context = 1.0
                else: context = 0.2
            elif is_study:
                if 8 <= hour <= 22: context = 0.8
                else: context = 0.1
            else:
                if hour >= 22: context = 0.1 # penalize after 10 PM
                else: context = 0.6
                
            score = (urgency * 0.45) + (importance_score * 0.30) + (slot_fit * 0.15) + (context * 0.10)
            
            scored_slots.append({
                "slot_idx": free_slots.index(slot),
                "score": score,
                "urgency": urgency,
                "importance": importance_score,
                "fit": slot_fit,
                "context": context
            })
            
        scored_slots.sort(key=lambda x: x["score"], reverse=True)
        
        remaining_mins = duration_mins
        for best in scored_slots:
            if remaining_mins <= 0:
                break
                
            idx = best["slot_idx"]
            slot = free_slots[idx]
            
            if slot["duration"] <= 0:
                continue
                
            chunk_mins = min(remaining_mins, slot["duration"])
            if chunk_mins < 15 and remaining_mins >= 15:
                continue # don't place tiny chunks unless it's the last piece
                
            slot_end = slot["start"] + timedelta(minutes=chunk_mins)
            
            schedule_blocks.append({
                "title": task.get("title", "Task"),
                "start_time": slot["start"],
                "end_time": slot_end,
                "date": slot["start"].strftime("%Y-%m-%d"),
                "source": "gyau",
                "task_id": str(task.get("_id") or task.get("id") or ""),
                "user_id": user_id
            })
            
            logger.info(f"Task: {task.get('title')} -> Slot: {slot['start']} (Score: {best['score']:.2f})")
            
            # Update free slot
            slot["start"] = slot_end
            slot["duration"] -= chunk_mins
            remaining_mins -= chunk_mins
            
    # 7. Execute DB updates
    if events_to_delete:
        await db["calendar_events"].delete_many({"_id": {"$in": events_to_delete}})
        logger.info(f"Deleted {len(events_to_delete)} old flexible events.")
        
    if schedule_blocks:
        await db["calendar_events"].insert_many(schedule_blocks)
        logger.info(f"Inserted {len(schedule_blocks)} new scheduled blocks.")
