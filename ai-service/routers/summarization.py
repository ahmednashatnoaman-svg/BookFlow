from fastapi import APIRouter, Request, HTTPException
import os
from models.schemas import SummarizeRequest, AIBookSummary, ChatRequest, ChatResponse
from services.llm_client import json_completion, chat_completion

router = APIRouter()

SUMMARY_SYSTEM = "You are a literary expert. Always respond with valid JSON only, no markdown."

SUMMARY_TEMPLATE_EN = """Analyze this book and return ONLY a JSON object with these exact keys:
- summary: 2-3 sentence engaging overview
- key_themes: array of 3-5 theme strings
- target_audience: who would enjoy this book
- mood: emotional tone/vibe of the book
- similar_books: array of 2-3 "Title by Author" strings
- reading_time_estimate: e.g. "8-10 hours"

Book: "{title}" by {author}
Category: {category}
Description: {description}"""

SUMMARY_TEMPLATE_AR = """حلّل هذا الكتاب وأعد JSON فقط مع المفاتيح التالية:
- summary: ملخص جذاب في 2-3 جمل
- key_themes: مصفوفة من 3-5 موضوعات
- target_audience: من سيستمتع بهذا الكتاب
- mood: النبرة العاطفية للكتاب
- similar_books: مصفوفة من 2-3 كتب "العنوان للمؤلف"
- reading_time_estimate: مثال "8-10 ساعات"

الكتاب: "{title}" للمؤلف {author}
الفئة: {category}
الوصف: {description}"""


@router.post("/", response_model=AIBookSummary)
async def summarize_book(req: SummarizeRequest, request: Request):
    template = SUMMARY_TEMPLATE_AR if req.language == "ar" else SUMMARY_TEMPLATE_EN
    prompt = template.format(
        title=req.title,
        author=req.author,
        category=req.category or "General",
        description=(req.description or "No description available")[:800],
    )

    try:
        data = await json_completion(
            messages=[{"role": "user", "content": prompt}],
            system=SUMMARY_SYSTEM,
            max_tokens=900,
        )
        # Ensure all required fields are present with fallbacks
        return AIBookSummary(
            summary=data.get("summary", ""),
            key_themes=data.get("key_themes", []),
            target_audience=data.get("target_audience", ""),
            mood=data.get("mood", ""),
            similar_books=data.get("similar_books", []),
            reading_time_estimate=data.get("reading_time_estimate", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {e}")


@router.post("/chat", response_model=ChatResponse)
async def chat_about_book(req: ChatRequest):
    lang_instruction = "Respond in Arabic." if req.language == "ar" else "Respond in English."
    system = (
        f"You are a knowledgeable reading assistant for BookFlow, a book exchange platform. "
        f'The user is asking about "{req.title}" by {req.author}. '
        f"Description: {req.description or 'Not provided'}. "
        f"Be helpful, concise, and enthusiastic about books. {lang_instruction}"
    )

    try:
        response_text = await chat_completion(
            messages=[{"role": "user", "content": req.message}],
            system=system,
            max_tokens=500,
            temperature=0.5,
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")
