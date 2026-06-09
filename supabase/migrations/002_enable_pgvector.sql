-- ============================================================
-- BookFlow — pgvector for semantic search & recommendations
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to book_listings (384-dim for all-MiniLM-L6-v2)
ALTER TABLE public.book_listings
  ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS idx_listings_embedding
  ON public.book_listings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Semantic search function ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_books_semantic(
  query_embedding vector(384),
  similarity_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20,
  filter_status TEXT DEFAULT 'available'
)
RETURNS TABLE (
  id UUID, title TEXT, author TEXT, cover_image TEXT,
  listing_type TEXT, condition TEXT, price NUMERIC,
  city TEXT, created_at TIMESTAMPTZ, similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.id, bl.title, bl.author, bl.cover_image,
    bl.listing_type, bl.condition, bl.price,
    bl.city, bl.created_at,
    1 - (bl.embedding <=> query_embedding) AS similarity
  FROM public.book_listings bl
  WHERE bl.status = filter_status
    AND bl.embedding IS NOT NULL
    AND 1 - (bl.embedding <=> query_embedding) > similarity_threshold
  ORDER BY bl.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── Recommendation function ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_similar_books(
  source_listing_id UUID,
  match_count INT DEFAULT 6
)
RETURNS TABLE (
  id UUID, title TEXT, author TEXT, cover_image TEXT,
  listing_type TEXT, condition TEXT, price NUMERIC,
  city TEXT, similarity FLOAT
)
LANGUAGE plpgsql AS $$
DECLARE
  source_embedding vector(384);
BEGIN
  SELECT embedding INTO source_embedding
  FROM public.book_listings WHERE id = source_listing_id;

  IF source_embedding IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    bl.id, bl.title, bl.author, bl.cover_image,
    bl.listing_type, bl.condition, bl.price, bl.city,
    1 - (bl.embedding <=> source_embedding) AS similarity
  FROM public.book_listings bl
  WHERE bl.id != source_listing_id
    AND bl.status = 'available'
    AND bl.embedding IS NOT NULL
  ORDER BY bl.embedding <=> source_embedding
  LIMIT match_count;
END;
$$;

-- ── Collaborative filtering: "users who liked X also liked" ──
CREATE OR REPLACE FUNCTION public.get_collaborative_recommendations(
  p_user_id UUID,
  match_count INT DEFAULT 6
)
RETURNS TABLE (id UUID, title TEXT, author TEXT, cover_image TEXT,
               listing_type TEXT, condition TEXT, price NUMERIC, score FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH user_wishlist AS (
    SELECT listing_id FROM public.wishlist WHERE user_id = p_user_id
  ),
  similar_users AS (
    SELECT DISTINCT w.user_id
    FROM public.wishlist w
    WHERE w.listing_id IN (SELECT listing_id FROM user_wishlist)
      AND w.user_id != p_user_id
    LIMIT 50
  ),
  candidate_books AS (
    SELECT w.listing_id, COUNT(*) AS score
    FROM public.wishlist w
    JOIN similar_users su ON su.user_id = w.user_id
    WHERE w.listing_id NOT IN (SELECT listing_id FROM user_wishlist)
    GROUP BY w.listing_id
    ORDER BY score DESC
    LIMIT match_count
  )
  SELECT bl.id, bl.title, bl.author, bl.cover_image,
         bl.listing_type, bl.condition, bl.price,
         cb.score::FLOAT
  FROM candidate_books cb
  JOIN public.book_listings bl ON bl.id = cb.listing_id
  WHERE bl.status = 'available';
END;
$$;
