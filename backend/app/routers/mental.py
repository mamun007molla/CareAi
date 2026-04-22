@router.post("/vqa", response_model=dict)
async def medical_vqa(
    image: UploadFile = File(...),
    question: str = Form(...),
    cu: User = Depends(get_current_user),
):
    from app.ai.groq_vision import medical_vqa as ai_vqa

    img_bytes, mime_type = await read_upload_bytes(image)
    return await ai_vqa(img_bytes, question, mime_type)
