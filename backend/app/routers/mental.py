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





# ── M3-4: Report Summarization (Groq text + easyocr for image) ───────────────
@router.post("/summarize-report", response_model=dict)
async def summarize_report(
    report_text: str = Form(None),
    file: UploadFile = File(None),
    cu: User = Depends(get_current_user),
):
    from app.ai.groq_ai import summarize_report as groq_summary
    text = ""
    if file:
        try:
            from app.ai.ocr_extract import extract_text_from_image
            img_bytes, _ = await read_upload_bytes(file)
            text = await extract_text_from_image(img_bytes)
        except Exception as e:
            raise HTTPException(500, f"OCR error: {str(e)}")
    elif report_text:
        text = report_text
    else:
        raise HTTPException(400, "Provide report_text or a file")

    result = await groq_summary(text)
    return {"key_findings":result.key_findings,"summary":result.summary,
            "medications_mentioned":result.medications_mentioned,"follow_up_needed":result.follow_up_needed}


