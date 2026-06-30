def score_tasks(tasks: list) -> list:
    """
    Ranks tasks based on formula:
    score = urgency + priority + energy_match - fatigue_penalty
    """
    scored = []
    for t in tasks:
        # Mocking urgency based on arbitrary rules for demo
        urgency = 20 if t.get('category') == 'Big' else 10
        
        # Priority mapping
        priority_map = {'Big': 30, 'Small': 15, 'Personal': 5}
        priority = priority_map.get(t.get('category', 'Small'), 10)
        
        # Energy match (assume high energy for Big tasks, lower for Personal)
        energy_match = 10
        
        # Fatigue penalty
        fatigue_penalty = 5 if t.get('duration_minutes', 60) > 90 else 0
        
        score = urgency + priority + energy_match - fatigue_penalty
        
        t_copy = dict(t)
        t_copy['score'] = score
        scored.append(t_copy)
        
    # Sort descending by score
    return sorted(scored, key=lambda x: x['score'], reverse=True)
