-- ============================================================
-- BookFlow — Initial Schema
-- ============================================================

-- ── User Profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  phone       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  city        TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en     TEXT NOT NULL,
  name_ar     TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT '📚',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.categories (name_en, name_ar, slug, icon, sort_order) VALUES
  ('Textbooks', 'كتب دراسية', 'textbooks', '🎓', 1),
  ('Fiction', 'روايات', 'fiction', '📖', 2),
  ('Non-Fiction', 'غير خيالي', 'non-fiction', '📰', 3),
  ('Science & Tech', 'علوم وتكنولوجيا', 'science-tech', '🔬', 4),
  ('Business', 'أعمال', 'business', '💼', 5),
  ('Self-Help', 'تطوير الذات', 'self-help', '🌱', 6),
  ('History', 'تاريخ', 'history', '🏛️', 7),
  ('Religion', 'دين', 'religion', '☪️', 8),
  ('Children', 'أطفال', 'children', '🧸', 9),
  ('Arts & Design', 'فنون وتصميم', 'arts-design', '🎨', 10),
  ('Language', 'لغات', 'language', '🌍', 11),
  ('Other', 'أخرى', 'other', '📦', 12)
ON CONFLICT (slug) DO NOTHING;

-- ── Book Listings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  author          TEXT NOT NULL,
  isbn            TEXT,
  category_id     UUID REFERENCES public.categories(id),
  condition       TEXT NOT NULL CHECK (condition IN ('new','good','acceptable','poor')),
  listing_type    TEXT NOT NULL CHECK (listing_type IN ('sale','exchange')),
  status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available','sold','exchanged','unavailable')),
  price           NUMERIC(10,2),
  description     TEXT,
  images          TEXT[] NOT NULL DEFAULT '{}',
  cover_image     TEXT,
  audio_url       TEXT,
  ai_summary      JSONB,
  publisher       TEXT,
  published_year  INT,
  language        TEXT NOT NULL DEFAULT 'en',
  city            TEXT,
  view_count      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- full-text search
  fts             TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(author,'') || ' ' || coalesce(description,''))
  ) STORED
);

CREATE INDEX idx_listings_user       ON public.book_listings(user_id);
CREATE INDEX idx_listings_category   ON public.book_listings(category_id);
CREATE INDEX idx_listings_status     ON public.book_listings(status);
CREATE INDEX idx_listings_type       ON public.book_listings(listing_type);
CREATE INDEX idx_listings_created    ON public.book_listings(created_at DESC);
CREATE INDEX idx_listings_fts        ON public.book_listings USING GIN(fts);
CREATE INDEX idx_listings_isbn       ON public.book_listings(isbn) WHERE isbn IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.book_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Book Requests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       UUID NOT NULL REFERENCES public.book_listings(id) ON DELETE CASCADE,
  requester_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  offer_listing_id UUID REFERENCES public.book_listings(id),
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','rejected')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, requester_id)
);

CREATE INDEX idx_requests_listing   ON public.book_requests(listing_id);
CREATE INDEX idx_requests_requester ON public.book_requests(requester_id);
CREATE INDEX idx_requests_status    ON public.book_requests(status);

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON public.book_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Wishlist ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.book_listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_wishlist_user    ON public.wishlist(user_id);
CREATE INDEX idx_wishlist_listing ON public.wishlist(listing_id);

-- ── Transactions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES public.book_listings(id),
  seller_id    UUID NOT NULL REFERENCES public.user_profiles(id),
  buyer_id     UUID NOT NULL REFERENCES public.user_profiles(id),
  request_id   UUID NOT NULL REFERENCES public.book_requests(id),
  type         TEXT NOT NULL CHECK (type IN ('sale','exchange')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX idx_transactions_buyer  ON public.transactions(buyer_id);

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ── Reports / Flags ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.user_profiles(id),
  listing_id  UUID REFERENCES public.book_listings(id),
  user_id     UUID REFERENCES public.user_profiles(id),
  reason      TEXT NOT NULL,
  details     TEXT,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
