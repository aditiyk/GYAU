from datetime import datetime, timedelta
import dateutil.parser

def compute_priority(task: dict) -> dict:
    """
    Computes priority score using:
    priority_score = (deadline_urgency * 0.5) + (importance * 0.3) + (estimated_effort * 0.2)
    """
    deadline_str = task.get("deadline")
    importance = float(task.get("importance") or 3) # default 3
    estimated_hours = float(task.get("estimated_hours") or 1.0) # default 1 hour
    
    deadline_urgency = 0
    if deadline_str:
        try:
            # Simple heuristic for urgency based on deadline strings
            # If Gayu or the user set something like 'tomorrow' or 'today' or an actual date
            lower_d = deadline_str.lower()
            if "today" in lower_d or "tonight" in lower_d or "end of day" in lower_d:
                deadline_urgency = 5
            elif "tomorrow" in lower_d:
                deadline_urgency = 4
            elif "this week" in lower_d:
                deadline_urgency = 3
            else:
                # try parsing the date
                try:
                    dt = dateutil.parser.parse(deadline_str, fuzzy=True)
                    days_away = (dt - datetime.now()).days
                    if days_away <= 1:
                        deadline_urgency = 5
                    elif days_away <= 3:
                        deadline_urgency = 4
                    elif days_away <= 7:
                        deadline_urgency = 3
                    elif days_away <= 14:
                        deadline_urgency = 2
                    else:
                        deadline_urgency = 1
                except:
                    deadline_urgency = 2 # unknown format
        except Exception:
            deadline_urgency = 2
    else:
        # no deadline
        deadline_urgency = 1
        
    # Estimated effort score (longer tasks need more priority to get done)
    # Let's say 1-5 scale where > 5 hours = 5
    estimated_effort = min(5.0, estimated_hours)
    
    # Calculate final priority score
    priority_score = (deadline_urgency * 0.5) + (importance * 0.3) + (estimated_effort * 0.2)
    
    # Assign label
    if priority_score >= 4.0:
        priority_label = "High"
    elif priority_score >= 2.5:
        priority_label = "Medium"
    else:
        priority_label = "Low"
        
    # Return updated task dictionary
    task_out = dict(task)
    task_out["priority_score"] = priority_score
    task_out["priority_label"] = priority_label
    return task_out
