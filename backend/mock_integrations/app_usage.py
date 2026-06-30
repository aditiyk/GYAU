from datetime import datetime

def get_mock_usage():
    return [
        {"app_name": "YouTube", "duration_minutes": 155, "timestamp": datetime.now()},
        {"app_name": "Instagram", "duration_minutes": 100, "timestamp": datetime.now()},
        {"app_name": "LinkedIn", "duration_minutes": 80, "timestamp": datetime.now()},
        {"app_name": "Snapchat", "duration_minutes": 45, "timestamp": datetime.now()},
    ]
