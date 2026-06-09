from fastapi import APIRouter, Request, HTTPException
from supabase import create_client
import os
from models.schemas import RecommendRequest, BookRecommendation

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

@router.post("/similar", response_model=list[BookRecommendation])
async def get_similar_books(req: RecommendRequest, request: Request):
    embeddings = request.app.state.embeddings
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if req.listing_id:
        result = supabase.rpc("get_similar_books", {
            "source_listing_id": req.listing_id,
            "match_count": 6,
        }).execute()
        books = result.data or []
        return [
            BookRecommendation(
                id=b["id"], title=b["title"], author=b["author"],
                cover_image=b.get("cover_image"), listing_type=b["listing_type"],
                condition=b["condition"], price=b.get("price"),
                score=round(b.get("similarity", 0.5), 3),
                reason="Similar content",
            )
            for b in books
        ]

    # Fallback: embed query text and do vector search
    if req.title:
        query_text = f"{req.title} {req.author or ''} {req.category or ''}".strip()
        embedding = embeddings.embed(query_text)
        result = supabase.rpc("search_books_semantic", {
            "query_embedding": embedding,
            "similarity_threshold": 0.2,
            "match_count": 6,
        }).execute()
        books = result.data or []
        return [
            BookRecommendation(
                id=b["id"], title=b["title"], author=b["author"],
                cover_image=b.get("cover_image"), listing_type=b["listing_type"],
                condition=b["condition"], price=b.get("price"),
                score=round(b.get("similarity", 0.5), 3),
                reason="Semantically similar",
            )
            for b in books
        ]

    raise HTTPException(status_code=400, detail="Provide listing_id or title")

@router.post("/for-you", response_model=list[BookRecommendation])
async def get_personalized_recommendations(req: RecommendRequest, request: Request):
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = supabase.rpc("get_collaborative_recommendations", {
        "p_user_id": req.user_id,
        "match_count": 8,
    }).execute()
    books = result.data or []
    return [
        BookRecommendation(
            id=b["id"], title=b["title"], author=b["author"],
            cover_image=b.get("cover_image"), listing_type=b["listing_type"],
            condition=b["condition"], price=b.get("price"),
            score=round(float(b.get("score", 1)), 3),
            reason="Popular with readers like you",
        )
        for b in books
    ]

@router.post("/embed")
async def embed_listing(req: RecommendRequest, request: Request):
    """Generate and store embedding for a listing."""
    if not req.listing_id:
        raise HTTPException(status_code=400, detail="listing_id required")
    embeddings = request.app.state.embeddings
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    embedding = embeddings.embed_book(
        title=req.title or "",
        author=req.author or "",
        description=req.description or "",
        category=req.category or "",
    )

    supabase.table("book_listings").update({"embedding": embedding}).eq("id", req.listing_id).execute()
    return {"success": True, "dims": len(embedding)}
