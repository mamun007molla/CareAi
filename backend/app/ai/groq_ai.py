# backend/app/ai/groq_ai.py
"""Groq AI — llama-4-scout. Used for text analysis and summarization."""
import json, re
from app.core.config import settings
from app.schemas import ReportSummaryResult


def clean_json(text: str) -> str:
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```", "", text)
    return text.strip()


async def _groq_chat(system: str, user_msg: str, max_tokens: int = 800) -> str:
    """Base Groq call."""
    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY not set. Get free key at https://console.groq.com"
        )
    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    response = await client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=max_tokens,
        temperature=0.1,
    )
    return response.choices[0].message.content or ""
