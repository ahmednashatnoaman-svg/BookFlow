from pydantic import BaseModel
from typing import Optional

class SummarizeRequest(BaseModel):
    listing_id: str
    title: str
    author: str
    description: Optional[str] = None
    category: Optional[str] = None
    language: str = "en"

class AIBookSummary(BaseModel):
    summary: str
    key_themes: list[str]
    target_audience: str
    mood: str
    similar_books: list[str]
    reading_time_estimate: str

class TTSRequest(BaseModel):
    listing_id: str
    text: str
    language: str = "en"
    voice: str = "alloy"

class TTSResponse(BaseModel):
    audio_url: str
    duration_seconds: Optional[float] = None

class RecommendRequest(BaseModel):
    listing_id: Optional[str] = None
    user_id: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class BookRecommendation(BaseModel):
    id: str
    title: str
    author: str
    cover_image: Optional[str]
    listing_type: str
    condition: str
    price: Optional[float]
    score: float
    reason: str

class EmbedRequest(BaseModel):
    listing_id: str
    title: str
    author: str
    description: Optional[str] = None
    category: Optional[str] = None

class ISBNResponse(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    published_year: Optional[int] = None
    cover_image: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    isbn_10: Optional[str] = None
    isbn_13: Optional[str] = None

class ChatRequest(BaseModel):
    listing_id: str
    title: str
    author: str
    description: Optional[str] = None
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
