from datetime import datetime, timedelta
import dateutil.parser

def parse_time(time_str: str) -> datetime:
    try:
        return dateutil.parser.parse(time_str)
    except:
        return datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)

def generate_schedule(scored_tasks: list, calendar_events: list, user_prefs: dict = None) -> list:
    """
    Places scored tasks into a schedule.
    Respects real calendar events and slots flexible tasks into free time.
    """
    if user_prefs is None:
        user_prefs = {}
        
    productive_hours = user_prefs.get("productive_hours", {"start": 19, "end": 23})
    start_hour = int(productive_hours.get("start", 19))
    end_hour = int(productive_hours.get("end", 23))
    
    schedule = []
    
    # Sort tasks by priority
    # (Assuming scored_tasks already has priority_score, but we sort it just in case)
    scored_tasks = sorted(scored_tasks, key=lambda x: x.get("priority_score", 0), reverse=True)
    
    # Extract fixed vs flexible
    fixed_tasks = []
    flexible_tasks = []
    
    for t in scored_tasks:
        if t.get("day") and t.get("start_time"):
            fixed_tasks.append(t)
        else:
            flexible_tasks.append(t)
            
    # Process Google Calendar events to find busy slots
    busy_slots = []
    
    # 1. Add imported fixed timetable tasks as busy slots
    # They don't have absolute dates, they just say "Mon", "Tue".
    # For now, we'll map them to the upcoming week.
    now = datetime.now()
    days_map = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}
    
    today_weekday = now.weekday()
    
    # Convert fixed timetable tasks to absolute datetime ranges for the next 7 days
    for ft in fixed_tasks:
        d_name = str(ft.get("day")).strip()[:3].capitalize()
        if d_name in days_map:
            target_weekday = days_map[d_name]
            days_ahead = (target_weekday - today_weekday) % 7
            target_date = now + timedelta(days=days_ahead)
            
            st = parse_time(str(ft["start_time"])).replace(year=target_date.year, month=target_date.month, day=target_date.day)
            
            if ft.get("end_time"):
                et = parse_time(str(ft["end_time"])).replace(year=target_date.year, month=target_date.month, day=target_date.day)
            else:
                et = st + timedelta(minutes=int(ft.get("duration_minutes", 60)))
                
            busy_slots.append({
                "title": ft.get("title"),
                "start": st,
                "end": et,
                "category": ft.get("category", "Class"),
                "type": "fixed_timetable",
                "original": ft
            })
            
    # 2. Add Google Calendar events as busy slots
    for ce in calendar_events:
        st = parse_time(ce["start_time"])
        et = parse_time(ce["end_time"])
        busy_slots.append({
            "title": ce.get("title", "Busy"),
            "start": st,
            "end": et,
            "category": "Calendar",
            "type": "google_calendar"
        })
        
    # Add all busy slots to the final schedule for rendering
    for b in busy_slots:
        schedule.append({
            "id": f"busy_{b['title']}_{b['start'].timestamp()}",
            "title": b["title"],
            "category": b["category"],
            "day": b["start"].strftime("%a"),
            "date": b["start"].strftime("%Y-%m-%d"),
            "start_time": b["start"].strftime("%H:%M"),
            "end_time": b["end"].strftime("%H:%M"),
            "duration": (b["end"] - b["start"]).total_seconds() / 60
        })
        
    # Sort busy slots to easily find gaps
    busy_slots.sort(key=lambda x: x["start"])
    
    # Now slot flexible tasks into free time
    # We will search within the next 7 days
    search_days = 7
    
    for task in flexible_tasks:
        duration_mins = int(task.get('duration_minutes') or task.get('estimated_hours', 1.0) * 60)
        placed = False
        
        for day_offset in range(search_days):
            if placed: break
            
            target_date = now + timedelta(days=day_offset)
            current_time = target_date.replace(hour=start_hour, minute=0, second=0, microsecond=0)
            end_limit = target_date.replace(hour=end_hour, minute=0, second=0, microsecond=0)
            
            if current_time < now:
                current_time = now # don't schedule in the past
                
            if current_time >= end_limit:
                continue # missed the productive window for today
                
            day_busy = [b for b in busy_slots if b["start"].date() == target_date.date()]
            
            while current_time + timedelta(minutes=duration_mins) <= end_limit:
                slot_end = current_time + timedelta(minutes=duration_mins)
                
                # Check overlap
                overlap = False
                for b in day_busy:
                    if current_time < b["end"] and slot_end > b["start"]:
                        overlap = True
                        current_time = b["end"] # jump to end of this busy block
                        break
                        
                if not overlap:
                    # Place the task
                    schedule.append({
                        "id": task.get("_id") or task.get("title"),
                        "title": task.get("title"),
                        "category": task.get("category", "Study"),
                        "day": target_date.strftime("%a"),
                        "date": target_date.strftime("%Y-%m-%d"),
                        "start_time": current_time.strftime("%H:%M"),
                        "end_time": slot_end.strftime("%H:%M"),
                        "duration": duration_mins,
                        "priority_score": task.get("priority_score"),
                        "priority_label": task.get("priority_label")
                    })
                    
                    # Add to busy slots so next tasks don't overlap
                    busy_slots.append({
                        "title": task.get("title"),
                        "start": current_time,
                        "end": slot_end,
                        "category": "Scheduled",
                        "type": "auto_scheduled"
                    })
                    busy_slots.sort(key=lambda x: x["start"])
                    
                    placed = True
                    break
                    
    return schedule

