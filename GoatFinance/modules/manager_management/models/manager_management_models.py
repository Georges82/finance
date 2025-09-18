from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Manager Models
class ManagerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Manager's full name")
    role: str = Field(..., pattern="^(Manager|Team Leader)$", description="Role: Manager or Team Leader")
    telegram_username: str = Field(..., min_length=1, max_length=50, description="Telegram username")
    email: Optional[str] = Field(None, max_length=100, description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    status: str = Field("Active", pattern="^(Active|Inactive)$", description="Status: Active or Inactive")
    salary_type: str = Field(..., pattern="^(Commission-based|Fixed)$", description="Salary type")
    revenue_threshold: Optional[Decimal] = Field(None, ge=0, description="Revenue threshold for commission")
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=100, description="Commission rate percentage")
    fixed_salary: Optional[Decimal] = Field(None, ge=0, description="Fixed salary amount")
    assigned_models: Optional[List[str]] = Field(default=[], description="List of assigned model IDs")

    @validator('revenue_threshold', 'commission_rate', 'fixed_salary')
    def validate_salary_fields(cls, v, values):
        salary_type = values.get('salary_type')
        if salary_type == 'Commission-based':
            if 'revenue_threshold' in values and values['revenue_threshold'] is None:
                raise ValueError('Revenue threshold is required for commission-based salary')
            if 'commission_rate' in values and values['commission_rate'] is None:
                raise ValueError('Commission rate is required for commission-based salary')
        elif salary_type == 'Fixed':
            if 'fixed_salary' in values and values['fixed_salary'] is None:
                raise ValueError('Fixed salary is required for fixed salary type')
        return v

class ManagerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, pattern="^(Manager|Team Leader)$")
    telegram_username: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, pattern="^(Active|Inactive)$")
    salary_type: Optional[str] = Field(None, pattern="^(Commission-based|Fixed)$")
    revenue_threshold: Optional[Decimal] = Field(None, ge=0)
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    fixed_salary: Optional[Decimal] = Field(None, ge=0)
    assigned_models: Optional[List[str]] = Field(None)

# Assistant Models
class AssistantCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Assistant's full name")
    telegram_username: str = Field(..., min_length=1, max_length=50, description="Telegram username")
    status: str = Field("Active", pattern="^(Active|Inactive)$", description="Status: Active or Inactive")
    salary_type: str = Field("Fixed", pattern="^Fixed$", description="Salary type (Fixed only)")
    fixed_salary: Decimal = Field(..., ge=0, description="Fixed salary amount")
    salary_period: str = Field(..., pattern="^(Weekly|Bi-weekly|Monthly)$", description="Salary period")

class AssistantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    telegram_username: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[str] = Field(None, pattern="^(Active|Inactive)$")
    fixed_salary: Optional[Decimal] = Field(None, ge=0)
    salary_period: Optional[str] = Field(None, pattern="^(Weekly|Bi-weekly|Monthly)$")

# Salary Models
class ManagerSalaryCreate(BaseModel):
    manager_id: str = Field(..., description="Manager ID")
    period: str = Field(..., description="Salary period")
    year: int = Field(..., ge=2020, le=2030, description="Year")
    week1_salary: Optional[Decimal] = Field(0, ge=0, description="Week 1 salary")
    week2_salary: Optional[Decimal] = Field(0, ge=0, description="Week 2 salary")
    total_salary: Optional[Decimal] = Field(0, ge=0, description="Total salary")
    payment_status: str = Field("Not Paid", pattern="^(Paid|Not Paid)$", description="Payment status")

class AssistantSalaryCreate(BaseModel):
    assistant_id: str = Field(..., description="Assistant ID")
    period: str = Field(..., description="Salary period")
    year: int = Field(..., ge=2020, le=2030, description="Year")
    week1_salary: Optional[Decimal] = Field(0, ge=0, description="Week 1 salary")
    week2_salary: Optional[Decimal] = Field(0, ge=0, description="Week 2 salary")
    total_salary: Optional[Decimal] = Field(0, ge=0, description="Total salary")
    payment_status: str = Field("Not Paid", pattern="^(Paid|Not Paid)$", description="Payment status")

# Response Models
class ManagerResponse(BaseModel):
    manager_id: str
    name: str
    role: str
    telegram_username: str
    email: Optional[str]
    phone: Optional[str]
    status: str
    salary_type: str
    revenue_threshold: Optional[Decimal]
    commission_rate: Optional[Decimal]
    fixed_salary: Optional[Decimal]
    assigned_models: List[str]
    created_at: datetime
    updated_at: Optional[datetime]

class AssistantResponse(BaseModel):
    assistant_id: str
    name: str
    telegram_username: str
    status: str
    salary_type: str
    fixed_salary: Decimal
    salary_period: str
    created_at: datetime
    updated_at: Optional[datetime]

class ManagerSalaryResponse(BaseModel):
    salary_id: str
    manager_id: str
    period: str
    year: int
    week1_salary: Decimal
    week2_salary: Decimal
    total_salary: Decimal
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime]

class AssistantSalaryResponse(BaseModel):
    salary_id: str
    assistant_id: str
    period: str
    year: int
    week1_salary: Decimal
    week2_salary: Decimal
    total_salary: Decimal
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime]

# List Response Models
class ManagerListResponse(BaseModel):
    status: str
    message: str
    data: List[ManagerResponse]
    total_count: int

class AssistantListResponse(BaseModel):
    status: str
    message: str
    data: List[AssistantResponse]
    total_count: int

class ManagerSalaryListResponse(BaseModel):
    status: str
    message: str
    data: List[ManagerSalaryResponse]
    total_count: int

class AssistantSalaryListResponse(BaseModel):
    status: str
    message: str
    data: List[AssistantSalaryResponse]
    total_count: int
