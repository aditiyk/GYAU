from typing import List
from db.models import Task, AppUsageLog

def calculate_completion_rate(tasks: List[Task]) -> int:
    if not tasks:
        return 0
    completed = sum(1 for t in tasks if t.completed)
    return int((completed / len(tasks)) * 100)

def calculate_focus_score(app_logs: List[AppUsageLog], tasks: List[Task]) -> int:
    penalty = 0
    
    # Check app usage penalties
    youtube_mins = sum(log.usage_minutes for log in app_logs if log.app_name.lower() == "youtube")
    if youtube_mins > 120:
        penalty += 15
        
    insta_mins = sum(log.usage_minutes for log in app_logs if log.app_name.lower() == "instagram")
    if insta_mins > 90:
        penalty += 10
        
    # Check incomplete big tasks
    incomplete_big = sum(1 for t in tasks if not t.completed and t.category == "Big")
    if incomplete_big > 0:
        penalty += 20
        
    score = 100 - penalty
    return max(0, min(100, score))

def calculate_productivity_score(tasks: List[Task]) -> int:
    if not tasks:
        return 0
        
    actual_score = 0
    max_score = 0
    
    for t in tasks:
        pts = 0
        if t.category == "Big":
            pts = 5
        elif t.category == "Small":
            pts = 2
        elif t.category == "Personal":
            pts = 1
            
        max_score += pts
        if t.completed:
            actual_score += pts
            
    if max_score == 0:
        return 0
        
    return int((actual_score / max_score) * 100)
