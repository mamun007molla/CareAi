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



# ── Activity/Posture Analysis ─────────────────────────────────────────────────
async def analyze_activity_image(
    image_bytes: bytes, question: str, mime_type: str = "image/jpeg"
) -> str:
    prompt = f"""You are monitoring an elderly patient's physical activity.
Analyze this image carefully.

Question: {question}

Focus on: posture, activity, safety concerns, recommendations."""
    return await openrouter_image(image_bytes, prompt, mime_type)



