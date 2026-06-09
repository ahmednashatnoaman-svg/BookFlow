from fastapi import APIRouter, Query, HTTPException
from models.schemas import ISBNResponse
from services.isbn_service import lookup_isbn

router = APIRouter()

@router.get("/", response_model=ISBNResponse)
async def get_book_by_isbn(isbn: str = Query(..., description="ISBN-10 or ISBN-13")):
    try:
        return await lookup_isbn(isbn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
