# backend/app/schemas/__init__.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ELDERLY   = "ELDERLY"
    CAREGIVER = "CAREGIVER"

# ── Auth ──────────────────────────────────────────────────────────────
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
    id: str
    name: str
    email: str
    phone: Optional[str]
    role: UserRole
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ── Activity Log ──────────────────────────────────────────────────────
class ActivityLogCreate(BaseModel):
    type: str
    duration: Optional[int] = None
    notes: Optional[str] = None
    logged_at: Optional[datetime] = None

class ActivityLogOut(BaseModel):
    id: str
    user_id: str
    logged_by: Optional[str]
    type: str
    duration: Optional[int]
    notes: Optional[str]
    logged_at: datetime
    class Config:
        from_attributes = True

# ── Routine ───────────────────────────────────────────────────────────
class RoutineCreate(BaseModel):
    title: str
    type: str
    scheduled_at: str
    days: List[str]
    is_active: bool = True

class RoutineOut(BaseModel):
    id: str
    user_id: str
    title: str
    type: str
    scheduled_at: str
    days: List[str]
    is_active: bool
    created_at: datetime

    @field_validator("days", mode="before")
    @classmethod
    def parse_days(cls, v):
        import json
        if isinstance(v, str):
            return json.loads(v)
        return v

    class Config:
        from_attributes = True

# ── Medication Verify ─────────────────────────────────────────────────
class MedicationVerifyResult(BaseModel):
    matched: bool
    confidence: float
    detected_medication: Optional[str] = None
    prescribed_medication: Optional[str] = None
    warnings: List[str] = []
    raw_response: Optional[str] = None

class MedicationVerifyLogOut(BaseModel):
    id: str
    user_id: str
    prescribed_medication: str
    detected_medication: Optional[str]
    matched: bool
    confidence: Optional[str]
    image_url: Optional[str]
    verified_at: datetime
    class Config:
        from_attributes = True
