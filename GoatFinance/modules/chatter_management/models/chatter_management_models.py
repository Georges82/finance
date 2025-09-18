from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from enum import Enum

class Shift(str, Enum):
    A = "A"
    B = "B"
    C = "C"

class ChatterCreate(BaseModel):
    name: str = Field(..., description="Full name of the chatter")
    telegram_username: str = Field(..., description="Telegram username for internal contact")
    country: str = Field(..., description="Country of residence")
    shift: Shift = Field(..., description="Assigned shift (A/B/C)")
    notes: Optional[str] = Field(None, description="Optional notes about the chatter")
    status: Literal["active", "inactive"] = Field(default="active", description="Chatter operational status")
    payment_status: Literal["Paid", "Not Paid"] = Field(default="Not Paid", description="Payment status")
    soft_delete: Literal["active", "deleted"] = Field(default="active", description="Soft delete status (backend controlled)")

class ChatterUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Full name of the chatter")
    telegram_username: Optional[str] = Field(None, description="Telegram username for internal contact")
    country: Optional[str] = Field(None, description="Country of residence")
    shift: Optional[Shift] = Field(None, description="Assigned shift (A/B/C)")
    notes: Optional[str] = Field(None, description="Optional notes about the chatter")
    status: Optional[Literal["active", "inactive"]] = Field(None, description="Chatter operational status")
    soft_delete: Optional[Literal["active", "deleted"]] = Field(None, description="Soft delete status (backend controlled)")
    last_salary_period: Optional[str] = Field(None, description="Last salary period")
    amount_for_period: Optional[float] = Field(None, description="Amount for the last salary period")
    payment_status: Optional[Literal["Paid", "Not Paid"]] = Field(None, description="Payment status")


class ChatterRateAdd(BaseModel):
    models_count: int = Field(..., ge=1, le=5, description="Number of models (1-5)")
    hourly_rate: float = Field(..., gt=0, description="Hourly rate for this model count")

class ChatterRateUpdate(BaseModel):
    models_count: Optional[int] = Field(None, ge=1, le=5, description="Number of models (1-5)")
    hourly_rate: Optional[float] = Field(None, gt=0, description="Hourly rate for this model count")

class ChatterRateUpdate(BaseModel):
    models_count: int = Field(..., ge=1, le=5, description="Number of models (1-5)")
    hourly_rate: float = Field(..., gt=0, description="Hourly rate for this model count")

class ChatterRatesUpdate(BaseModel):
    rates: List[ChatterRateUpdate] = Field(..., description="List of rates for different model counts")

class ChatterResponse(BaseModel):
    chatter_id: str
    name: str
    telegram_username: str
    country: str
    shift: str
    status: str
    notes: Optional[str]
    last_salary_period: Optional[str]
    amount_for_period: Optional[float]
    payment_status: str
    created_at: Optional[str]
    updated_at: Optional[str]

class ChatterRateResponse(BaseModel):
    rate_id: str
    chatter_id: str
    models_count: int
    hourly_rate: float
    created_at: Optional[str]
    updated_at: Optional[str]
