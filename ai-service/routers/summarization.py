from fastapi import APIRouter, Request, HTTPException
from anthropic import AsyncAnthropic
import os
import json
from models.schemas import SummarizeRequest, AIBookSummary, ChatRequest, ChatResponse

router = APIRouter()
anthropic = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

SUMMARY_PROMPT_EN = """You are a literary expert. Analyze this book and respond in JSON only.

Book: "{title}" by {author}
Category: {category}
Description: {description}

Return exactly this JSON (no markdown):
{{
  "summary": "2-3 sentence engaging summary",
  "key_themes": ["theme1", "theme2", "theme3"],
  "target_audience": "who would enjoy this book",
  "mood": "emotional tone/vibe",
  "similar_books": ["Book Title by Author", "Book Title by Author"],
  "reading_time_estimate": "e.g., 8-10 hours"
}}"""

SUMMARY_PROMPT_AR = """أنت خبير أدبي. حلّل هذا الكتاب وأجب بـ JSON فقط.

الكتاب: "{title}" للمؤلف {author}
الفئة: {category}
الوصف: {description}

أعد هذا JSON بالضبط (بدون markdown):
{{
  "summary": "ملخص جذاب في 2-3 جمل",
  "key_themes": ["موضوع1", "موضوع2", "موضوع3"],
  "target_audience": "من سيستمتع بهذا الكتاب",
  "mood": "النبرة العاطفية",
  "similar_books": ["عنوان الكتاب للمؤلف", "عنوان الكتاب للمؤلف"],
  "reading_time_estimate": "مثال: 8-10 ساعات"
}}"""

@router.post("/", response_model=AIBookSummary)
async def summarize_book(req: SummarizeRequest, request: Request):
    prompt_template = SUMMARY_PROMPT_AR if req.language == "ar" else SUMMARY_PROMPT_EN
    prompt = prompt_template.format(
        title=req.title,
        author=req.author,
        category=req.category or "General",
        description=req.description or "No description available",
    )

    try:
        message = await anthropic.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = message.content[0].text.strip()
        data = json.loads(raw)
        return AIBookSummary(**data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse)
async def chat_about_book(req: ChatRequest):
    system = f"""You are a knowledgeable reading assistant.
    The user is asking about the book "{req.title}" by {req.author}.
    Description: {req.description or 'Not provided'}
    Be helpful, concise, and enthusiastic about books.
    {"Respond in Arabic." if req.language == 'ar' else "Respond in English."}"""

    try:
        message = await anthropic.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            system=system,
            messages=[{"role": "user", "content": req.message}],
        )
        return ChatResponse(response=message.content[0].text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
