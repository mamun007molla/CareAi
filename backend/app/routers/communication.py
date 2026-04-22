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
# Feature 1 — Messaging (Elder ↔ Caregiver ↔ Doctor)
# ══════════════════════════════════════════════════════════════════════════════
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

@router.get("/messages/{other_user_id}", response_model=list[dict])
def get_messages(other_user_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    msgs = db.query(Message).filter(
        ((Message.sender_id == cu.id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == cu.id))
    ).order_by(Message.created_at.asc()).all()
    # Mark as read
    for m in msgs:
        if m.receiver_id == cu.id and not m.is_read:
            m.is_read = True
    db.commit()
    return [{"id":m.id,"sender_id":m.sender_id,"receiver_id":m.receiver_id,
             "content":m.content,"is_read":m.is_read,"created_at":m.created_at.isoformat()} for m in msgs]

@router.post("/messages", response_model=dict, status_code=201)
def send_message(body: MessageCreate, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    receiver = db.query(User).filter(User.id == body.receiver_id).first()
    if not receiver:
        raise HTTPException(404, "User not found")
    msg = Message(id=str(uuid.uuid4()), sender_id=cu.id, receiver_id=body.receiver_id, content=body.content)
    db.add(msg)
    db.add(Notification(
        id=str(uuid.uuid4()), user_id=body.receiver_id, type="message",
        title=f"💬 Message from {cu.name}",
        message=body.content[:100],
        action_url="/communication/messages",
    ))
    db.commit()
    return {"id":msg.id,"content":msg.content,"created_at":msg.created_at.isoformat()}

@router.get("/contacts", response_model=list[dict])
def get_contacts(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    """Get all users I can message."""
    if cu.role == "ELDERLY":
        links = db.query(PatientLink).filter(PatientLink.patient_id == cu.id).all()
        user_ids = [l.linked_id for l in links]
    else:
        links = db.query(PatientLink).filter(PatientLink.linked_id == cu.id).all()
        patient_ids = [l.patient_id for l in links]
        # Also get other caregivers/doctors of same patients
        all_links = db.query(PatientLink).filter(PatientLink.patient_id.in_(patient_ids)).all()
        user_ids = list(set([l.patient_id for l in links] + [l.linked_id for l in all_links if l.linked_id != cu.id]))

    contacts = []
    for uid in user_ids:
        u = db.query(User).filter(User.id == uid).first()
        if u:
            unread = db.query(Message).filter(Message.sender_id == uid, Message.receiver_id == cu.id, Message.is_read == False).count()
            contacts.append({"id":u.id,"name":u.name,"role":u.role,"email":u.email,"unread":unread})
    return contacts



