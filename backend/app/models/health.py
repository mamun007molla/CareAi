import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class HealthRecord(Base):
    __tablename__ = "health_records"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    visit_date = Column(DateTime, nullable=False)
    doctor_name = Column(String(255), nullable=True)
    diagnosis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    attachments = Column(Text, nullable=True)  # JSON: list of file paths
    created_at = Column(DateTime, default=datetime.utcnow)
