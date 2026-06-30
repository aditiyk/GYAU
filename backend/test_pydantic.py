from bson import ObjectId
from db.models import Task
from fastapi.encoders import jsonable_encoder

try:
    task = Task(title="Test", category="Small", fixed_or_flexible="Flexible")
    task.id = ObjectId()
    print("Encoder output:", jsonable_encoder(task))
except Exception as e:
    print(f"Exception: {repr(e)}")
