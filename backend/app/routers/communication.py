# backend/app/routers/communication.py
"""Module 3 — Emergency & Communication"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, PatientLink
from app.models.communication import Message, Appointment, EmergencyContact
from app.models.notification import Notification
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/communication", tags=["Module 3 — Communication"])





# ══════════════════════════════════════════════════════════════════════════════
# Feature 3 — Emergency Contacts
# ══════════════════════════════════════════════════════════════════════════════
class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relation: str
    is_primary: bool = False

@router.get("/emergency-contacts", response_model=list[dict])
def get_emergency_contacts(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    contacts = db.query(EmergencyContact).filter(EmergencyContact.user_id == cu.id).order_by(EmergencyContact.is_primary.desc()).all()
    return [{"id":c.id,"name":c.name,"phone":c.phone,"relation":c.relation,"is_primary":c.is_primary} for c in contacts]

@router.post("/emergency-contacts", response_model=dict, status_code=201)
def add_emergency_contact(body: EmergencyContactCreate, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if body.is_primary:
        db.query(EmergencyContact).filter(EmergencyContact.user_id == cu.id).update({"is_primary": False})
    contact = EmergencyContact(
        id=str(uuid.uuid4()), user_id=cu.id,
        name=body.name, phone=body.phone, relation=body.relation, is_primary=body.is_primary,
    )
    db.add(contact); db.commit()
    return {"id":contact.id,"name":contact.name,"phone":contact.phone}

@router.delete("/emergency-contacts/{contact_id}", status_code=204)
def delete_emergency_contact(contact_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    c = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id, EmergencyContact.user_id == cu.id).first()
    if not c: raise HTTPException(404, "Not found")
    db.delete(c); db.commit()
