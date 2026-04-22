# backend/app/routers/health.py
import json, uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, PatientLink
from app.models.health import Medication, HealthRecord, Prescription, MealLog
from app.schemas import (
    MedicationCreate,
    MedicationOut,
    HealthRecordCreate,
    HealthRecordOut,
    PrescriptionOut,
    ReportSummaryResult,
    MealLogCreate,
    MealLogOut,
)

router = APIRouter(prefix="/health", tags=["Module 2 — Health Management"])


def get_linked_patient_ids(db: Session, user_id: str) -> list[str]:
    links = db.query(PatientLink).filter(PatientLink.linked_id == user_id).all()
    return [l.patient_id for l in links]




# ══════════════════════════════════════════════════════════════════════════════
# Feature 4 — Meal & Nutrition Tracker
# ELDERLY: add+view own | CAREGIVER+DOCTOR: view linked
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/meals", response_model=list[MealLogOut])
def get_meals(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role == "ELDERLY":
        return (
            db.query(MealLog)
            .filter(MealLog.user_id == cu.id)
            .order_by(MealLog.logged_at.desc())
            .limit(50)
            .all()
        )
    patient_ids = get_linked_patient_ids(db, cu.id)
    return (
        db.query(MealLog)
        .filter(MealLog.user_id.in_(patient_ids))
        .order_by(MealLog.logged_at.desc())
        .limit(50)
        .all()
    )


@router.post("/meals", response_model=MealLogOut, status_code=201)
def log_meal(
    body: MealLogCreate,
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    if cu.role != "ELDERLY":
        raise HTTPException(403, "Only patients can log their meals")
    meal = MealLog(
        id=str(uuid.uuid4()),
        user_id=cu.id,
        meal_type=body.meal_type,
        description=body.description,
        calories=body.calories,
        protein=body.protein,
        carbs=body.carbs,
        fat=body.fat,
        logged_at=body.logged_at or datetime.utcnow(),
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/meals/{meal_id}", status_code=204)
def delete_meal(
    meal_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    if cu.role != "ELDERLY":
        raise HTTPException(403, "Only patients can delete their meals")
    m = (
        db.query(MealLog)
        .filter(MealLog.id == meal_id, MealLog.user_id == cu.id)
        .first()
    )
    if not m:
        raise HTTPException(404, "Not found")
    db.delete(m)
    db.commit()


@router.get("/meals/today-stats", response_model=dict)
def today_nutrition_stats(
    db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    from datetime import date

    today_start = datetime.combine(date.today(), datetime.min.time())
    meals = (
        db.query(MealLog)
        .filter(MealLog.user_id == cu.id, MealLog.logged_at >= today_start)
        .all()
    )
    return {
        "total_meals": len(meals),
        "calories": sum(m.calories or 0 for m in meals),
        "protein": sum(m.protein or 0 for m in meals),
        "carbs": sum(m.carbs or 0 for m in meals),
        "fat": sum(m.fat or 0 for m in meals),
    }


# ── Feature 4 Extended: AI Food Image Analysis ────────────────────────────────
@router.post("/meals/analyze-image", response_model=dict)
async def analyze_food_image(
    image: UploadFile = File(...),
    cu: User = Depends(get_current_user),
):
    if cu.role != "ELDERLY":
        raise HTTPException(403, "Only patients can analyze food images")
    from app.ai.groq_vision import analyze_food_image as ai_analyze
    from app.utils.file_upload import read_upload_bytes

    img_bytes, mime_type = await read_upload_bytes(image)
    return await ai_analyze(img_bytes, mime_type)
