# backend/app/routers/physical.py
import json, uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.physical import ActivityLog, Routine, MedicationVerifyLog
from app.schemas import (
    ActivityLogCreate, ActivityLogOut,
    RoutineCreate, RoutineOut,
    MedicationVerifyResult, MedicationVerifyLogOut,
)

router = APIRouter(prefix="/physical", tags=["Module 1 — Physical Monitoring"])




# ── Feature 4: Routine Schedule ───────────────────────────────────────────────
@router.get("/routines", response_model=list[RoutineOut])
def get_routines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Routine).filter(Routine.user_id == current_user.id, Routine.is_active == True).all()

@router.post("/routines", response_model=RoutineOut, status_code=201)
def create_routine(body: RoutineCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    routine = Routine(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=body.title,
        type=body.type,
        scheduled_at=body.scheduled_at,
        days=json.dumps(body.days),
        is_active=body.is_active,
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine

@router.put("/routines/{routine_id}", response_model=RoutineOut)
def update_routine(routine_id: str, body: RoutineCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    routine = db.query(Routine).filter(Routine.id == routine_id, Routine.user_id == current_user.id).first()
    if not routine:
        raise HTTPException(404, "Routine not found")
    routine.title = body.title
    routine.type = body.type
    routine.scheduled_at = body.scheduled_at
    routine.days = json.dumps(body.days)
    routine.is_active = body.is_active
    db.commit()
    db.refresh(routine)
    return routine

@router.delete("/routines/{routine_id}", status_code=204)
def delete_routine(routine_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    routine = db.query(Routine).filter(Routine.id == routine_id, Routine.user_id == current_user.id).first()
    if not routine:
        raise HTTPException(404, "Not found")
    db.delete(routine)
    db.commit()


