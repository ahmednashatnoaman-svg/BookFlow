from sentence_transformers import SentenceTransformer
import numpy as np
import os

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

class EmbeddingService:
    def __init__(self):
        self.model: SentenceTransformer | None = None
        self.is_loaded = False

    async def load(self):
        self.model = SentenceTransformer(MODEL_NAME)
        self.is_loaded = True

    def embed(self, text: str) -> list[float]:
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def embed_book(self, title: str, author: str, description: str = "", category: str = "") -> list[float]:
        text = f"{title} by {author}. {category}. {description}"[:512]
        return self.embed(text)

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        va, vb = np.array(a), np.array(b)
        denom = np.linalg.norm(va) * np.linalg.norm(vb)
        return float(np.dot(va, vb) / denom) if denom > 0 else 0.0
