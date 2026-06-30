import requests
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "SuperSecretFallbackKey123!"
token = jwt.encode({"sub": "test_user", "email": "test@test.com", "exp": datetime.utcnow() + timedelta(days=1)}, SECRET_KEY, algorithm="HS256")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
payload = {"title": "Test", "category": "Small", "fixed_or_flexible": "Flexible", "completed": False, "deadline": "30-06-2026 22:33", "estimated_hours": 1, "importance": 2}
r = requests.post("http://localhost:8000/tasks/", json=payload, headers=headers)
print("STATUS:", r.status_code)
print("TEXT:", r.text)
