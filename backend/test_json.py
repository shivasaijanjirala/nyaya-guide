import asyncio
from app.config import settings
from google import genai
from google.genai import types

async def main():
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
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

    prompt = f"{SYSTEM_PROMPT}\n\nUser situation: how to file a divorce"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=2048,
        ),
    )
    print("--- RAW RESPONSE ---")
    print(repr(response.text))
    print("--------------------")

if __name__ == "__main__":
    asyncio.run(main())
