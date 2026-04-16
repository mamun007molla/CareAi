# backend/app/ai/report_summarizer.py
"""
Feature 3 — Medical Report / Prescription AI Summarizer
Uses local Ollama (gemma3:4b) via LangChain.
Falls back to OpenAI if OPENAI_API_KEY is set.
"""
import re, json, os
from app.core.config import settings
from app.schemas import ReportSummaryResult


def strip_thinking(text: str) -> str:
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'<unused\d+>.*?(?=\n\n|\Z)', '', text, flags=re.DOTALL)
    return text.strip()


async def summarize_report(report_text: str) -> ReportSummaryResult:
    """
    Summarize a medical report/prescription into key findings.
    Uses Ollama (local) → OpenAI (fallback).
    """
    prompt = f"""You are a medical report summarization assistant for elderly care.
Analyze this medical report and respond ONLY as valid JSON with no extra text:

{{
  "key_findings": ["<finding1>", "<finding2>"],
  "summary": "<2-3 sentence plain-language summary>",
  "medications_mentioned": ["<med1>", "<med2>"],
  "follow_up_needed": true or false
}}

Medical report:
{report_text[:3000]}"""

    # ── Try Ollama ────────────────────────────────────────────────────────────
    try:
        import httpx
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            base_url=settings.OLLAMA_BASE_URL,
            api_key="ollama",
            http_client=httpx.AsyncClient(),
        )
        response = await client.chat.completions.create(
            model=settings.SUMMARIZER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
        )
        raw = strip_thinking(response.choices[0].message.content or "")

        # Parse JSON
        try:
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"): raw = raw[4:]
            data = json.loads(raw.strip())
            return ReportSummaryResult(
                key_findings=data.get("key_findings", []),
                summary=data.get("summary", ""),
                medications_mentioned=data.get("medications_mentioned", []),
                follow_up_needed=data.get("follow_up_needed", False),
            )
        except Exception:
            return ReportSummaryResult(
                key_findings=[],
                summary=raw[:400],
                medications_mentioned=[],
                follow_up_needed=False,
            )

    except Exception as e1:
        print(f"[Ollama Summarizer Error] {e1}")

        # ── OpenAI fallback ───────────────────────────────────────────────────
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                response = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=800,
                    response_format={"type": "json_object"},
                )
                data = json.loads(response.choices[0].message.content or "{}")
                return ReportSummaryResult(
                    key_findings=data.get("key_findings", []),
                    summary=data.get("summary", ""),
                    medications_mentioned=data.get("medications_mentioned", []),
                    follow_up_needed=data.get("follow_up_needed", False),
                )
            except Exception as e2:
                print(f"[OpenAI Summarizer Error] {e2}")

        return ReportSummaryResult(
            key_findings=[],
            summary="AI unavailable. Start Ollama: ollama serve && ollama pull gemma3:4b",
            medications_mentioned=[],
            follow_up_needed=False,
        )
