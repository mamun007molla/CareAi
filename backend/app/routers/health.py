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
# Feature 1 — Medication Reminder
# ELDERLY: add+view own | DOCTOR: view linked | CAREGIVER: view linked
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/medications", response_model=list[MedicationOut])
def get_medications(
    db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    if cu.role == "ELDERLY":
        return (
            db.query(Medication)
            .filter(Medication.user_id == cu.id, Medication.is_active == True)
            .all()
        )
    patient_ids = get_linked_patient_ids(db, cu.id)
    return (
        db.query(Medication)
        .filter(Medication.user_id.in_(patient_ids), Medication.is_active == True)
        .all()
    )


@router.post("/medications", response_model=MedicationOut, status_code=201)
def create_medication(
    body: MedicationCreate,
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    if cu.role != "ELDERLY":
        raise HTTPException(403, "Only patients can add their own medications")
    med = Medication(
        id=str(uuid.uuid4()),
        user_id=cu.id,
        name=body.name,
        dosage=body.dosage,
        frequency=body.frequency,
        times=json.dumps(body.times),
        start_date=body.start_date,
        end_date=body.end_date,
        instructions=body.instructions,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/medications/{med_id}", status_code=204)
def delete_medication(
    med_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    if cu.role != "ELDERLY":
        raise HTTPException(403, "Only patients can delete their medications")
    med = (
        db.query(Medication)
        .filter(Medication.id == med_id, Medication.user_id == cu.id)
        .first()
    )
    if not med:
        raise HTTPException(404, "Not found")
    med.is_active = False
    db.commit()


@router.get("/medications/stats", response_model=dict)
def medication_stats(
    db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    meds = (
        db.query(Medication)
        .filter(Medication.user_id == cu.id, Medication.is_active == True)
        .all()
    )
    return {
        "active_count": len(meds),
        "daily_doses": sum(len(json.loads(m.times)) for m in meds),
    }


