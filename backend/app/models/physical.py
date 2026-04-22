# backend/app/models/physical.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id         = Column(String, primary_key=True, default=gen_uuid)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    logged_by  = Column(String, nullable=True)
    type       = Column(String(100), nullable=False)
    duration   = Column(Integer, nullable=True)
    notes      = Column(Text, nullable=True)
    logged_at  = Column(DateTime, default=datetime.utcnow)

