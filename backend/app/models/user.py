# backend/app/models/user.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, Boolean
from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())




class PatientLink(Base):
    """Links Caregiver or Doctor to an Elderly patient."""

    __tablename__ = "patient_links"
    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, nullable=False, index=True)  # ELDERLY user id
    linked_id = Column(String, nullable=False, index=True)  # CAREGIVER or DOCTOR id
    role = Column(String(20), nullable=False)  # "CAREGIVER" or "DOCTOR"
    relation = Column(String(100), nullable=True)  # "parent","spouse","patient" etc
    created_at = Column(DateTime, default=datetime.utcnow)
