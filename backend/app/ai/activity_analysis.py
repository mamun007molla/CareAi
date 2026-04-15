# backend/app/ai/activity_analysis.py
"""
Medical Image Analysis — Feature 1 (Activity Tracker)
Uses local Ollama (medgemma) — exact medgemma_api.py logic.
"""
import base64, re
from app.core.config import settings

SYSTEM_INSTRUCTIONS = """You will help the patient by analyzing the medical image and provide a report.
we know you are not expert and you do not have to say this just do deep analysis the image
and come up with your thought and no need to mention to see a specialist we will do it anyway."""


def strip_thinking(text: str) -> str:
    text = re.sub(r'<unused\d+>thought.*?(?=\n\n|\Z)', '', text, flags=re.DOTALL)
    text = re.sub(r'<unused\d+>[^<]*', '', text)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    return text.strip()


async def analyze_activity_image(
    image_bytes: bytes,
    question: str,
    mime_type: str = "image/jpeg",
) -> str:
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
            model=settings.MEDGEMMA_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": f"{SYSTEM_INSTRUCTIONS}\n\nQuestion: {question}"},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                ],
            }],
            max_tokens=800,
        )

        return strip_thinking(response.choices[0].message.content or "No analysis available.")

    except Exception as e:
        print(f"[Ollama Activity Error] {e}")
        return f"AI unavailable. Make sure Ollama is running and model is pulled: ollama pull {settings.MEDGEMMA_MODEL}"
