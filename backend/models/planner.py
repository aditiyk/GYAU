from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
import uuid

class PlannerImport(BaseModel):
    import_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_name: str
    source_type: str  # e.g., "spreadsheet", "image", "csv"
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    parsed_data: List[dict]
    active: bool = True

class ImportUpdateResponse(BaseModel):
    success: bool
    imports: List[PlannerImport]
