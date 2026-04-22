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



# ══════════════════════════════════════════════════════════════════════════════
# Feature 2 — Health History
# DOCTOR: add+view linked patients | ELDERLY: view own | CAREGIVER: view linked
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/records", response_model=list[HealthRecordOut])
def get_health_records(
    db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    if cu.role == "ELDERLY":
        return (
            db.query(HealthRecord)
            .filter(HealthRecord.user_id == cu.id)
            .order_by(HealthRecord.visit_date.desc())
            .all()
        )
    patient_ids = get_linked_patient_ids(db, cu.id)
    return (
        db.query(HealthRecord)
        .filter(HealthRecord.user_id.in_(patient_ids))
        .order_by(HealthRecord.visit_date.desc())
        .all()
    )


@router.post("/records", response_model=HealthRecordOut, status_code=201)
def create_health_record(
    body: HealthRecordCreate,
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    # Only DOCTOR can add health records
    if cu.role != "DOCTOR":
        raise HTTPException(403, "Only doctors can add health records")
    # Doctor must be linked to a patient — add for first linked patient or specify
    patient_ids = get_linked_patient_ids(db, cu.id)
    if not patient_ids:
        raise HTTPException(
            400, "You have no linked patients. Link a patient from Settings first."
        )
    # Add record for the patient (use patient_id from body or first linked)
    record = HealthRecord(
        id=str(uuid.uuid4()),
        user_id=patient_ids[0],  # first linked patient
        visit_date=body.visit_date,
        doctor_name=cu.name,  # auto-fill with doctor's name
        diagnosis=body.diagnosis,
        notes=body.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    # Notify the patient
    from app.models.notification import Notification

    db.add(
        Notification(
            id=str(uuid.uuid4()),
            user_id=patient_ids[0],
            type="prescription",
            title=f"📋 New Health Record Added",
            message=f"Dr. {cu.name} added a new health record: {body.diagnosis or 'Visit notes'}",
        )
    )
    db.commit()
    return record


@router.delete("/records/{record_id}", status_code=204)
def delete_health_record(
    record_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)
):
    if cu.role != "DOCTOR":
        raise HTTPException(403, "Only doctors can delete health records")
    r = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not r:
        raise HTTPException(404, "Not found")
    db.delete(r)
    db.commit()


