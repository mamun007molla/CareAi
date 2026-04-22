from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ELDERLY   = "ELDERLY"
    CAREGIVER = "CAREGIVER"
    DOCTOR    = "DOCTOR"

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: UserRole = UserRole.ELDERLY

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str; name: str; email: str; phone: Optional[str]; role: UserRole; created_at: datetime
    class Config: from_attributes = True

class TokenResponse(BaseModel):
    access_token: str; token_type: str = "bearer"; user: UserOut

# Module 1
class ActivityLogCreate(BaseModel):
    type: str; duration: Optional[int] = None; notes: Optional[str] = None; logged_at: Optional[datetime] = None

class ActivityLogOut(BaseModel):
    id: str; user_id: str; logged_by: Optional[str]; type: str
    duration: Optional[int]; notes: Optional[str]; logged_at: datetime
    class Config: from_attributes = True


# Module 2
class MedicationCreate(BaseModel):
    name: str; dosage: str; frequency: str; times: List[str]
    start_date: datetime; end_date: Optional[datetime] = None; instructions: Optional[str] = None

class MedicationOut(BaseModel):
    id: str; user_id: str; name: str; dosage: str; frequency: str
    times: List[str]; start_date: datetime; end_date: Optional[datetime]
    instructions: Optional[str]; is_active: bool; created_at: datetime
    @field_validator("times", mode="before")
    @classmethod
    def parse_times(cls, v):
        import json
        return json.loads(v) if isinstance(v, str) else v
    class Config: from_attributes = True


