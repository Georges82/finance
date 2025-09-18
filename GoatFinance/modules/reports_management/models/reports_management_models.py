from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional


class ReferenceChild(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    model_id: str
    hours: float = Field(..., ge=0, le=24)
    net_sales: float = Field(..., ge=0)


class DayRow(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    model_id: str
    hours: int = Field(..., ge=0, le=24)
    net_sales: float = Field(..., ge=0)
    # For reference models, this contains the child models data
    reference_children: Optional[List[ReferenceChild]] = None


class WeekReportSaveRequest(BaseModel):
    chatter_id: str
    period: str
    year: int
    week: int = Field(..., ge=1, le=2)
    # date_rows: list of {date: YYYY-MM-DD, rows: [DayRow, ...]}
    date_rows: List[dict]





