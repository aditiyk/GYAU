from db.models import Task, AppUsageLog
from analytics.scoring import calculate_focus_score, calculate_productivity_score
from analytics.screen_mining import get_most_distracting_app, get_peak_distraction_window
from typing import List, Dict

def generate_insights(tasks: List[Task], app_logs: List[AppUsageLog]) -> Dict[str, str]:
    """
    Generates human-readable AI insights based on scores and task data.
    """
    focus_score = calculate_focus_score(app_logs, tasks)
    prod_score = calculate_productivity_score(tasks)
    
    # Analyze task completion trends
    completed_personal = sum(1 for t in tasks if t.completed and t.category == "Personal")
    incomplete_big = sum(1 for t in tasks if not t.completed and t.category == "Big")
    
    prod_insight = "Your productivity is balanced."
    if incomplete_big > 0:
        prod_insight = "Big tasks are often postponed."
    elif prod_score > 80:
        prod_insight = "You're consistently completing high-impact tasks!"
    elif completed_personal > 3:
        prod_insight = "You complete personal tasks consistently."
        
    focus_insight = "Your focus is solid."
    distracting_app = get_most_distracting_app(app_logs)
    distraction_window = get_peak_distraction_window(app_logs)
    
    if focus_score < 70 and distracting_app != "None":
        focus_insight = f"You're most distracted on {distracting_app} between {distraction_window}."
        
    recommendation = "Keep up the good work!"
    if focus_score < 70:
        recommendation = f"Try turning on Focus Mode during your peak distraction hours to block {distracting_app}."
    elif incomplete_big > 0:
        recommendation = "Try breaking down your Big Tasks into smaller, manageable chunks."
        
    return {
        "focus_insight": focus_insight,
        "productivity_insight": prod_insight,
        "recommendation": recommendation
    }
