# backend/app/models/communication.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum
from app.core.database import Base

def gen_uuid(): return str(uuid.uuid4())



class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id           = Column(String, primary_key=True, default=gen_uuid)
    user_id      = Column(String, nullable=False, index=True)
    name         = Column(String(255), nullable=False)
    phone        = Column(String(50), nullable=False)
    relation     = Column(String(100), nullable=False)
    is_primary   = Column(Boolean, default=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
