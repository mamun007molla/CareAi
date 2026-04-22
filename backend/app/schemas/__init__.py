from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ELDERLY = "ELDERLY"
    CAREGIVER = "CAREGIVER"
    DOCTOR = "DOCTOR"


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






class HealthRecordCreate(BaseModel):
    visit_date: datetime
    doctor_name: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None


class HealthRecordOut(BaseModel):
    id: str
    user_id: str
    visit_date: datetime
    doctor_name: Optional[str]
    diagnosis: Optional[str]
    notes: Optional[str]
    attachments: Optional[List[str]]
    created_at: datetime

    @field_validator("attachments", mode="before")
    @classmethod
    def parse_attachments(cls, v):
        import json

        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v or []

    class Config:
        from_attributes = True











