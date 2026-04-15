# backend/app/ai/medication_verify.py
"""
Medication Image Verification — Feature 2
Uses local Ollama (gemma3:4b) — exact peel_verification_API.py logic.
"""
import base64, re
from app.core.config import settings
from app.schemas import MedicationVerifyResult

PRESCRIPTION_SCHEDULE = """
AT Morning there will be 3 tablet, 1 red, 1 blue, 1 green.
AT Noon there will be 5 tablet, 2 of them white, 1 red, 1 blue, 1 green.
AT Night there will be 5 tablet, 2 of them white, 1 red, 1 blue, 1 green.
"""

SYSTEM_INSTRUCTIONS = f"""You will be given a picture which contain few peels,
you have to analyse the image, count the peels and match the colors of the peels from
the image to verify the medicine the user uploaded are correct.
{PRESCRIPTION_SCHEDULE}
If Matches with description you will simply reply That all medicines are correct take them with water"""


def strip_thinking(text: str) -> str:
    text = re.sub(r'<unused\d+>thought.*?(?=\n\n|\Z)', '', text, flags=re.DOTALL)
    text = re.sub(r'<unused\d+>[^<]*', '', text)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    return text.strip()


async def verify_medication_image(
    image_bytes: bytes,
    prescribed_medication: str,
    mime_type: str = "image/jpeg",
) -> MedicationVerifyResult:
    b64 = base64.b64encode(image_bytes).decode()

    try:
        import httpx
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            base_url=settings.OLLAMA_BASE_URL,
            api_key="ollama",
            http_client=httpx.AsyncClient(),
        )

        response = await client.chat.completions.create(
            model=settings.PILL_VERIFY_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": f"{SYSTEM_INSTRUCTIONS}\n\nPrescribed: {prescribed_medication}"},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                ],
            }],
            max_tokens=500,
        )

        raw = strip_thinking(response.choices[0].message.content or "")
        matched = any(w in raw.lower() for w in ["correct","all medicines","take them with water","match","verified"])

        return MedicationVerifyResult(
            matched=matched,
            confidence=0.85 if matched else 0.3,
            detected_medication=raw[:300],
            prescribed_medication=prescribed_medication,
            warnings=[] if matched else ["Medicines may not match. Please double-check."],
            raw_response=raw,
        )

    except Exception as e:
        print(f"[Ollama Verify Error] {e}")
        return MedicationVerifyResult(
            matched=False, confidence=0.0,
            detected_medication=None,
            prescribed_medication=prescribed_medication,
            warnings=[
                "AI unavailable. Make sure Ollama is running.",
                "Run: ollama serve",
                f"Then: ollama pull {settings.PILL_VERIFY_MODEL}",
            ],
            raw_response=str(e),
        )
