# backend/app/routers/physical.py
import json, uuid, os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.physical import ActivityLog, Routine, MedicationVerifyLog
from app.schemas import (
    ActivityLogCreate, ActivityLogOut,
    RoutineCreate, RoutineOut,
    MedicationVerifyResult, MedicationVerifyLogOut,
)

router = APIRouter(prefix="/physical", tags=["Module 1 — Physical Monitoring"])




# ── Medication Verification (Ollama medgemma) ─────────────────────────────────
@router.post("/verify-medication", response_model=MedicationVerifyResult)
async def verify_medication(
    image: UploadFile = File(...),
    prescribed_medication: str = Form(...),
    save_log: bool = Form(True),
    db: Session = Depends(get_db),
    cu: User = Depends(get_current_user),
):
    from app.ai.medication_verify import verify_medication_image
    from app.utils.file_upload import read_upload_bytes
    import aiofiles

    img_bytes, mime_type = await read_upload_bytes(image)
    result = await verify_medication_image(img_bytes, prescribed_medication, mime_type)

    if save_log:
        try:
            upload_dir = "./uploads/medications"
            os.makedirs(upload_dir, exist_ok=True)
            fname = f"{uuid.uuid4().hex}.jpg"
            async with aiofiles.open(f"{upload_dir}/{fname}", "wb") as f:
                await f.write(img_bytes)
            file_url = f"/uploads/medications/{fname}"
        except Exception:
            file_url = None

        log = MedicationVerifyLog(
            id=str(uuid.uuid4()), user_id=cu.id,
            prescribed_medication=prescribed_medication,
            detected_medication=result.detected_medication,
            matched=result.matched,
            confidence=str(round(result.confidence, 2)),
            image_url=file_url,
        )
        db.add(log); db.commit()
    return result

@router.get("/verify-medication/history", response_model=list[MedicationVerifyLogOut])
def get_verify_history(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    return db.query(MedicationVerifyLog).filter(
        MedicationVerifyLog.user_id == cu.id
    ).order_by(MedicationVerifyLog.verified_at.desc()).limit(20).all()


