def generate_planner_insights(schedule: list) -> list:
    """
    Generates planning insights based on the generated schedule density and task types.
    """
    insights = []
    
    if not schedule:
        return ["Your day is completely free! Time to relax or add some tasks."]
        
    big_tasks = sum(1 for s in schedule if s.get('category') == 'Big')
    if big_tasks >= 3:
        insights.append("Warning: You have 3 or more Big tasks today. High risk of burnout! Take frequent breaks.")
        
    total_minutes = sum(s.get('duration', 60) for s in schedule)
    if total_minutes > 8 * 60:
        insights.append("Your schedule is packed with over 8 hours of focused work.")
    else:
        insights.append("You have a balanced workload today with room for flexibility.")
        
    insights.append("I scheduled your hardest tasks early in the day when your energy is highest.")
    
    return insights
