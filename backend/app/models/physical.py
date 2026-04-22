# backend/app/models/physical.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())








class MedicationVerifyLog(Base):
    __tablename__ = "medication_verify_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    prescribed_medication = Column(String(255), nullable=False)
    detected_medication = Column(String(255), nullable=True)
    matched = Column(Boolean, default=False)
    confidence = Column(String(10), nullable=True)
    image_url = Column(String(500), nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)
