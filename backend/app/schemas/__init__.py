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


class RoutineCreate(BaseModel):
    title: str; type: str; scheduled_at: str; days: List[str]; is_active: bool = True

class RoutineOut(BaseModel):
    id: str; user_id: str; title: str; type: str; scheduled_at: str
    days: List[str]; is_active: bool; created_at: datetime
    @field_validator("days", mode="before")
    @classmethod
    def parse_days(cls, v):
        import json
        return json.loads(v) if isinstance(v, str) else v
    class Config: from_attributes = True



# Module 2


class ReportSummaryResult(BaseModel):
    key_findings: List[str] = []; summary: str
    medications_mentioned: List[str] = []; follow_up_needed: bool = False

class MealLogCreate(BaseModel):
    meal_type: str; description: str; calories: Optional[int] = None
    protein: Optional[float] = None; carbs: Optional[float] = None
    fat: Optional[float] = None; logged_at: Optional[datetime] = None

class MealLogOut(BaseModel):
    id: str; user_id: str; meal_type: str; description: str
    calories: Optional[int]; protein: Optional[float]; carbs: Optional[float]
    fat: Optional[float]; logged_at: datetime
    class Config: from_attributes = True

class FoodAnalysisResult(BaseModel):
    food_name: str; ingredients: List[str] = []; calories: int = 0
    protein: float = 0; carbs: float = 0; fat: float = 0; fiber: float = 0
    serving_size: str = "1 serving"; meal_type_suggestion: str = "meal"; health_notes: str = ""
