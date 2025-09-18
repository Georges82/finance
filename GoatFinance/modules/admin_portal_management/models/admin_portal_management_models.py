from pydantic import BaseModel, Field, EmailStr
from typing import Literal
from enum import Enum

class Role(str, Enum):
    SUPER_ADMIN = "super admin"
    ADMIN = "admin"

class AdminCreate(BaseModel):
    admin_email: EmailStr
    admin_username: str
    admin_password: str
    admin_first_name: str
    admin_last_name : str
    admin_role: Role = Field(default=Role.ADMIN)
    status: Literal["active", "deleted"] = Field(default="active")

class LoginAdmin(BaseModel):
    email_or_username: str = Field(..., description="Email or Username of the Admin")
    password: str = Field(..., description="Password for login")

    class Config:
        from_attributes = True

class AdminUpdate(BaseModel):
    admin_email: EmailStr = Field(None, description="Email of the Admin")
    admin_username: str = Field(None, description="Username of the Admin")
    admin_password: str = Field(None, description="Password for the Admin")
    admin_first_name: str = Field(None, description="First Name of the Admin")
    admin_last_name: str = Field(None, description="Last Name of the Admin")
    admin_role: Role = Field(None, description="Role of the Admin")

    class Config:
        from_attributes = True
