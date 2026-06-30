from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from typing import Any
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.no_info_plain_validator_function(cls.validate),
            ],
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class Task(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    category: str # Big, Small, Personal
    fixed_or_flexible: str # Fixed, Flexible
    due_date: Optional[datetime] = None
    deadline: Optional[str] = None
    importance: Optional[int] = 1
    estimated_hours: Optional[float] = 1.0
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    edited_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(BaseModel):
    name: str
    email: str
    preferences: dict
    linked_apps: List[str]

class CalendarEvent(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    date: str
    source: Optional[str] = "google"
    task_id: Optional[str] = None

class AppUsageLog(BaseModel):
    app_name: str
    usage_minutes: int
    date: str

class MoodEnergy(BaseModel):
    date: str
    energy_score: int
    sentiment: str

class Payment(BaseModel):
    merchant: str
    amount: float
    due_date: datetime
    status: str

class AgentLog(BaseModel):
    trigger_type: str
    planner_output: str
    evaluator_output: str
    final_action: str

class AnalyticsSummary(BaseModel):
    top_distraction_app: str
    peak_distraction_window: str
    completion_trends: str
