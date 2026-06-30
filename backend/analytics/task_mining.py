import re

def classify_task(task_title: str) -> str:
    """
    Classifies a task into 'Personal', 'Big', or 'Small' based on keywords in the title.
    """
    title_lower = task_title.lower()
    
    personal_keywords = ['pay', 'call', 'eat', 'gym', 'drink', 'mom', 'doctor', 'lunch', 'health', 'self-care', 'errand']
    big_keywords = ['prepare', 'build', 'project', 'interview', 'report', 'exam', 'study', 'deep work']
    
    # Check for Big keywords first
    for word in big_keywords:
        if re.search(r'\b' + re.escape(word) + r'\b', title_lower):
            return "Big"
            
    # Check for Personal keywords
    for word in personal_keywords:
        if re.search(r'\b' + re.escape(word) + r'\b', title_lower):
            return "Personal"
            
    # Default to Small
    return "Small"
