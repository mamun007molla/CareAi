# backend/app/routers/mental.py
import uuid, json
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.mental import MoodEntry, ChecklistItem
from app.utils.file_upload import read_upload_bytes

router = APIRouter(prefix="/mental", tags=["Module 3"])





# ── M3-2: Medical VQA (Groq vision) ──────────────────────────────────────────
@router.post("/vqa", response_model=dict)
async def medical_vqa(
    image: UploadFile = File(...),
    question: str = Form(...),
    cu: User = Depends(get_current_user),
):
    from app.ai.groq_vision import medical_vqa as ai_vqa
    img_bytes, mime_type = await read_upload_bytes(image)
    return await ai_vqa(img_bytes, question, mime_type)


