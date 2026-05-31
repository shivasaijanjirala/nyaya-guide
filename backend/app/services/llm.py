"""
LLM Service - Google Gemini (Free tier)

Uses the google-genai SDK with gemini-2.0-flash model.
Gemini Flash is fast, free (within quota), and highly capable.

STRICT RULES for the AI Legal Assistant:
1. Only provide legal INFORMATION, never legal ADVICE
2. Cite specific Indian Acts, sections, and judgments
3. Always output valid JSON matching the defined schema
4. Assign risk level and confidence score
5. Include a disclaimer in every response
"""
import asyncio
import json
import re
from google import genai
from google.genai import types
from app.config import settings

# Initialize Gemini client lazily (reads key at call time, not import time)
_client = None
PRIMARY_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-2.0-flash"
MODELS = [PRIMARY_MODEL, FALLBACK_MODEL]

def _get_client():
    """Return a Gemini client, initializing it with the current GEMINI_API_KEY."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

SYSTEM_PROMPT = """You are a strictly lawful Indian legal information assistant named NyayaGuide.

STRICT RULES:
1. Provide legal INFORMATION only, NOT legal advice.
2. Analyze user facts as a case-study.
3. Identify relevant Indian laws, Acts, sections, and judgments.
4. Suggest ONLY lawful actions.
5. NEVER suggest illegal, unethical, or unsafe steps.
6. Always cite laws: Act name + section + short explanation.
7. Assign Risk Level: Low / Medium / High.
8. Give Confidence Score (0-100).
9. For high-risk, advise consulting a licensed advocate.
10. Respect DPDP Act and user privacy.

You MUST respond ONLY in this exact JSON format (no markdown, no code blocks, raw JSON only):
{
  "summary": "Brief analysis summary",
  "issues": ["Legal issue 1", "Legal issue 2"],
  "applicable_laws": [
    {"act": "Act name", "section": "Section number", "description": "What it means for the user"}
  ],
  "rights": ["Right 1", "Right 2"],
  "risk_level": "Low",
  "confidence_score": 75,
  "recommended_steps": ["Step 1", "Step 2"],
  "legal_timeline": [],
  "references": [{"title": "Reference title", "source": "Source name"}],
  "disclaimer": "This is legal information only, not legal advice. Consult a licensed advocate for your specific situation."
}"""

APPLICATION_SYSTEM_PROMPT = """You are a legal document drafting assistant for India.
Draft professional applications based on the user's details.

Respond ONLY in this exact JSON format (no markdown, raw JSON only):
{
  "application_type": "Type of application",
  "subject": "Subject line",
  "body": "Full formal application body text",
  "attachments_required": ["Document 1", "Document 2"],
  "submission_steps": ["Step 1", "Step 2"]
}"""


def _clean_json(text: str) -> str:
    """Remove markdown code fences if Gemini wraps JSON in them."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


def _error_response(message: str) -> dict:
    return {
        "summary": message,
        "issues": [],
        "applicable_laws": [],
        "rights": [],
        "risk_level": "Low",
        "confidence_score": 0,
        "recommended_steps": ["Please try again with a more specific question."],
        "legal_timeline": [],
        "references": [],
        "disclaimer": "This is legal information only, not legal advice. Consult a licensed advocate.",
    }


async def get_legal_response(user_message: str, language: str = "en") -> dict:
    """Send user message to Gemini with strict legal system prompt."""
    lang_note = ""
    if language == "hi":
        lang_note = "\n\nRespond in Hindi (Devanagari) keeping legal terms in English."
    elif language == "te":
        lang_note = "\n\nRespond in Telugu keeping legal terms in English."

    prompt = f"{SYSTEM_PROMPT}{lang_note}\n\nUser situation: {user_message}"

    # Try each model with retries (handles both 429 rate-limit and 503 high-demand)
    retry_delays = [2, 5, 10]  # seconds between retries
    last_error = None

    for model in MODELS:
        for attempt in range(len(retry_delays) + 1):
            try:
                response = _get_client().models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                    ),
                )
                raw = _clean_json(response.text)
                return json.loads(raw)

            except json.JSONDecodeError:
                return _error_response("Could not parse AI response. Please try again.")
            except Exception as e:
                err = str(e)
                last_error = err

                # Auth errors — no point retrying
                if "API_KEY" in err.upper() or "401" in err or "403" in err:
                    return _error_response(
                        "Gemini API key is missing or invalid. "
                        "Please set GEMINI_API_KEY in your backend/.env file. "
                        "Get a free key at https://aistudio.google.com/app/apikey"
                    )

                # 429 (rate limit) or 503 (high demand) — retry with delay, then try fallback model
                if ("429" in err or "503" in err or "UNAVAILABLE" in err.upper()) and attempt < len(retry_delays):
                    await asyncio.sleep(retry_delays[attempt])
                    continue

                # Other errors or exhausted retries — break to try next model
                break

    # All models exhausted
    return _error_response(
        "The AI service is currently experiencing high demand. "
        "Please try again in a few moments."
    )


async def generate_application(app_type: str, details: str, language: str = "en") -> dict:
    """Generate a structured application draft using Gemini."""
    prompt = f"{APPLICATION_SYSTEM_PROMPT}\n\nApplication type: {app_type}\n\nDetails: {details}"

    retry_delays = [2, 5, 10]

    for model in MODELS:
        for attempt in range(len(retry_delays) + 1):
            try:
                response = _get_client().models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.4,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                    ),
                )
                raw = _clean_json(response.text)
                return json.loads(raw)

            except Exception as e:
                err = str(e)
                if ("429" in err or "503" in err or "UNAVAILABLE" in err.upper()) and attempt < len(retry_delays):
                    await asyncio.sleep(retry_delays[attempt])
                    continue
                break  # try next model

    return {
        "application_type": app_type,
        "subject": "Could not generate draft",
        "body": "The AI service is currently experiencing high demand. Please try again in a few moments.",
        "attachments_required": [],
        "submission_steps": [],
    }
