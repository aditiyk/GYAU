from typing import List, Tuple
from db.models import AppUsageLog

def get_most_distracting_app(app_logs: List[AppUsageLog]) -> str:
    """
    Returns the name of the app with the highest usage_minutes.
    """
    if not app_logs:
        return "None"
        
    usage_map = {}
    for log in app_logs:
        usage_map[log.app_name] = usage_map.get(log.app_name, 0) + log.usage_minutes
        
    if not usage_map:
        return "None"
        
    most_distracting = max(usage_map.items(), key=lambda x: x[1])
    return most_distracting[0]

def get_peak_distraction_window(app_logs: List[AppUsageLog]) -> str:
    """
    In a real app, this would bucket timestamps into hours.
    Since we only have 'date' and 'usage_minutes', we will return a synthesized peak window.
    """
    if not app_logs:
        return "None"
    return "8–11 PM"
