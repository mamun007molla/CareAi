# backend/app/models/health.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from app.core.database import Base

def gen_uuid(): return str(uuid.uuid4())


# ── Feature 1: Medication Reminder ───────────────────────────────────────────
class Medication(Base):
    __tablename__ = "medications"
    id           = Column(String, primary_key=True, default=gen_uuid)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    name         = Column(String(255), nullable=False)
    dosage       = Column(String(100), nullable=False)
    frequency    = Column(String(100), nullable=False)
    times        = Column(Text, nullable=False)       # JSON: ["08:00","20:00"]
    start_date   = Column(DateTime, nullable=False)
    end_date     = Column(DateTime, nullable=True)
    instructions = Column(Text, nullable=True)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)


# ── Feature 2: Health History & Medical Documents ────────────────────────────
