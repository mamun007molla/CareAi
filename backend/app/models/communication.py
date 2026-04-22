# backend/app/models/communication.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum
from app.core.database import Base

def gen_uuid(): return str(uuid.uuid4())

class Message(Base):
    __tablename__ = "messages"
    id          = Column(String, primary_key=True, default=gen_uuid)
    sender_id   = Column(String, nullable=False, index=True)
    receiver_id = Column(String, nullable=False, index=True)
    content     = Column(Text, nullable=False)
    is_read     = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

