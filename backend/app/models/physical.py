# backend/app/models/physical.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())


class Routine(Base):
    __tablename__ = "routines"
    id           = Column(String, primary_key=True, default=gen_uuid)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    title        = Column(String(255), nullable=False)
    type         = Column(String(50), nullable=False)
    scheduled_at = Column(String(10), nullable=False)
    days         = Column(Text, nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

