from fastapi import APIRouter, HTTPException
from models.schemas import TTSRequest, TTSResponse
from services.tts_service import generate_tts

router = APIRouter()

@router.post("/", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    try:
        audio_url = await generate_tts(req.listing_id, req.text, req.language)
        return TTSResponse(audio_url=audio_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
