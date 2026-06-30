from datetime import datetime, timedelta

def check_triggers(tasks: list, payments: list, app_usage: list) -> str:
    """
    Deterministic rule-based trigger engine.
    Returns the first matching trigger string or 'No Trigger'.
    """
    now = datetime.now()
    
    # 1. Screen time threshold crossed (e.g. YouTube > 120 minutes)
    for app in app_usage:
        if app.get("app_name") == "YouTube" and app.get("duration_minutes", 0) > 120:
            return "high_youtube_usage"
        if app.get("duration_minutes", 0) > 240:
            return "excessive_screen_time"
            
    # 2. Payment due tomorrow or today
    for payment in payments:
        due_date = payment.get("due_date")
        if isinstance(due_date, str):
            try:
                due_date = datetime.fromisoformat(due_date.replace("Z", ""))
            except:
                due_date = None
        if due_date:
            delta = due_date - now
            if 0 <= delta.days <= 1:
                return "payment_due_soon"

    # 3. Tasks deadline approaching (e.g. unfinished tasks due in 2 hours)
    for task in tasks:
        due_date = task.get("due_date")
        if not task.get("completed", False) and due_date:
            if isinstance(due_date, str):
                try:
                    due_date = datetime.fromisoformat(due_date.replace("Z", ""))
                except:
                    due_date = None
            if due_date:
                delta = due_date - now
                if 0 <= delta.total_seconds() <= 7200: # 2 hours
                    return "task_deadline_approaching"

    return "No Trigger"
