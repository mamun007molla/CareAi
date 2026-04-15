import  uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.health import  HealthRecord
from app.schemas import (
    
    HealthRecordCreate,
    HealthRecordOut,
    
)

router = APIRouter(prefix="/health", tags=["Module 2 — Health Management"])

@router.get("/records", response_model=list[HealthRecordOut])
def get_health_records(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    return db.query(HealthRecord).filter(HealthRecord.user_id == cu.id).order_by(HealthRecord.visit_date.desc()).all()

@router.post("/records", response_model=HealthRecordOut, status_code=201)
def create_health_record(body: HealthRecordCreate, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    record = HealthRecord(
        id=str(uuid.uuid4()), user_id=cu.id,
        visit_date=body.visit_date, doctor_name=body.doctor_name,
        diagnosis=body.diagnosis, notes=body.notes,
    )
    db.add(record); db.commit(); db.refresh(record)
    return record

@router.delete("/records/{record_id}", status_code=204)
def delete_health_record(record_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    r = db.query(HealthRecord).filter(HealthRecord.id == record_id, HealthRecord.user_id == cu.id).first()
    if not r: raise HTTPException(404, "Not found")
    db.delete(r); db.commit()
