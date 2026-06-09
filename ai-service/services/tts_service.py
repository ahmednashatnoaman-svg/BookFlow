import os
import tempfile
import hashlib
from openai import AsyncOpenAI
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
OPENAI_KEY   = os.getenv("OPENAI_API_KEY", "")

openai_client = AsyncOpenAI(api_key=OPENAI_KEY)

VOICE_MAP = {
    "en": "alloy",
    "ar": "shimmer",
}

async def generate_tts(listing_id: str, text: str, language: str = "en") -> str:
    """Generate TTS audio, cache in Supabase Storage, return public URL."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Check cache first
    cache_key = hashlib.md5(f"{listing_id}:{language}".encode()).hexdigest()
    existing = supabase.table("book_listings").select("audio_url").eq("id", listing_id).single().execute()
    if existing.data and existing.data.get("audio_url"):
        return existing.data["audio_url"]

    voice = VOICE_MAP.get(language, "alloy")
    # Truncate text for TTS (max ~1000 chars for a good preview)
    preview_text = text[:900] + ("..." if len(text) > 900 else "")

    response = await openai_client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=preview_text,
        response_format="mp3",
    )

    audio_bytes = response.content
    filename = f"audio/{cache_key}.mp3"

    supabase.storage.from_("book-audio").upload(
        path=filename,
        file=audio_bytes,
        file_options={"content-type": "audio/mpeg", "upsert": "true"},
    )

    audio_url = f"{SUPABASE_URL}/storage/v1/object/public/book-audio/{filename}"

    # Cache URL in listing
    supabase.table("book_listings").update({"audio_url": audio_url}).eq("id", listing_id).execute()

    return audio_url
