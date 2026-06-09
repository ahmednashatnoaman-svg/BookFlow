from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from routers import recommendations, summarization, tts, isbn
from services.embeddings import EmbeddingService

embedding_service: EmbeddingService | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_service
    embedding_service = EmbeddingService()
    await embedding_service.load()
    app.state.embeddings = embedding_service
    yield
    # cleanup
    embedding_service = None

app = FastAPI(
    title="BookFlow AI Service",
    description="AI microservice: recommendations, TTS, summarization, ISBN lookup",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AI_SECRET = os.getenv("AI_SERVICE_SECRET", "dev-secret")

def verify_secret(x_service_secret: str = Header(...)):
    if x_service_secret != AI_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

app.include_router(recommendations.router, prefix="/recommend", tags=["Recommendations"], dependencies=[Depends(verify_secret)])
app.include_router(summarization.router,  prefix="/summarize",  tags=["Summarization"],  dependencies=[Depends(verify_secret)])
app.include_router(tts.router,            prefix="/tts",         tags=["TTS"],            dependencies=[Depends(verify_secret)])
app.include_router(isbn.router,           prefix="/isbn",        tags=["ISBN"],           dependencies=[Depends(verify_secret)])

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": app.state.embeddings.is_loaded}
