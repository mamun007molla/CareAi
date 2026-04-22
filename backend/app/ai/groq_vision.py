# backend/app/ai/groq_vision.py
"""
Vision AI — OpenRouter free models for image features.
Uses openrouter/free which auto-selects best free vision model.
Falls back to Groq llama-4-scout for text-only tasks.
"""
import base64, json, re
from app.core.config import settings


def extract_json(text: str):
    text = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return None


async def openrouter_image(
    image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg"
) -> str:
    """Send image to OpenRouter free vision model."""
    if not settings.OPENROUTER_API_KEY:
        raise ValueError(
            "OPENROUTER_API_KEY not set. Get free key at https://openrouter.ai"
        )

    import httpx

    b64 = base64.b64encode(image_bytes).decode()

    payload = {
        "model": "openrouter/free",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                    },
                ],
            }
        ],
        "max_tokens": 1024,
        "temperature": 0.1,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://careai.app",
                "X-Title": "CareAI",
            },
            json=payload,
        )
        if resp.status_code != 200:
            raise ValueError(f"OpenRouter error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return data["choices"][0]["message"]["content"] or ""


# ── Medication Verification ───────────────────────────────────────────────────
async def verify_medication(
    image_bytes: bytes, prescribed: str, mime_type: str = "image/jpeg"
) -> dict:
    prompt = f"""You are verifying medication for an elderly patient.
PRESCRIBED: {prescribed}

Look at this medicine image carefully.
1. What do you see? (pill colors, shapes, any text/label on packaging)
2. Does the label say "{prescribed}" or is it a known equivalent?

Respond ONLY with valid JSON:
{{
  "matched": true,
  "confidence": 0.90,
  "detected": "describe what you see",
  "warnings": []
}}"""
    raw = await openrouter_image(image_bytes, prompt, mime_type)
    data = extract_json(raw)
    if data:
        return {
            "matched": bool(data.get("matched", False)),
            "confidence": float(data.get("confidence", 0.5)),
            "detected_medication": str(data.get("detected", "")),
            "warnings": list(data.get("warnings", [])),
            "raw_response": raw,
        }
    matched = any(
        w in raw.lower() for w in ["match", "correct", "verified", "yes", "found"]
    )
    return {
        "matched": matched,
        "confidence": 0.7 if matched else 0.3,
        "detected_medication": raw[:300],
        "warnings": [],
        "raw_response": raw,
    }




# ── Medical VQA ───────────────────────────────────────────────────────────────
async def medical_vqa(
    image_bytes: bytes, question: str, mime_type: str = "image/jpeg"
) -> dict:
    prompt = f"""You are a medical AI helping elderly patients understand medical images.

Question: {question}

Respond ONLY with valid JSON:
{{
  "answer": "detailed answer",
  "confidence": 0.85,
  "related_findings": ["finding1"],
  "disclaimer": "AI analysis only. Always consult a qualified doctor."
}}"""
    raw = await openrouter_image(image_bytes, prompt, mime_type)
    data = extract_json(raw)
    if data:
        return {
            "answer": str(data.get("answer", raw[:400])),
            "confidence": float(data.get("confidence", 0.5)),
            "related_findings": list(data.get("related_findings", [])),
            "disclaimer": str(
                data.get("disclaimer", "Always consult a qualified doctor.")
            ),
            "raw_response": raw,
        }
    return {
        "answer": raw[:500],
        "confidence": 0.5,
        "related_findings": [],
        "disclaimer": "Always consult a qualified doctor.",
        "raw_response": raw,
    }


