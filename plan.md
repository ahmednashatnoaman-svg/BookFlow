# BookFlow — AI-Enhanced Book Exchange Platform
## Master Implementation Plan

## Goal
Production-grade peer-to-peer book marketplace with AI features:
smart recommender, AI reading assistant, TTS audio, ISBN autofill, semantic search.
Arabic + English (RTL). Deployed on Vercel + Railway.

---

## Stack Decision
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + pgvector + Auth + Storage + Realtime) |
| AI Service | FastAPI (Python) on Railway |
| AI Models | Claude API (summarize/Q&A) + OpenAI TTS + sentence-transformers (embeddings) |
| Auth | Supabase Auth (email + phone OTP) |
| Storage | Supabase Storage (book images) |
| i18n | next-intl (Arabic RTL + English) |
| Deploy | Vercel (frontend) + Railway (AI service) |

---

## Tasks

- [x] Master plan written → `plan.md`
- [ ] Next.js project scaffold + config → `frontend/`
- [ ] Supabase migrations (schema + pgvector + RLS + functions) → `supabase/migrations/`
- [ ] FastAPI AI microservice → `ai-service/`
- [ ] Shared types + Supabase client + utils → `frontend/src/lib/`
- [ ] Layout components (Header, Footer, i18n switcher)
- [ ] Book components (BookCard, BookGrid, Filters, Search)
- [ ] All pages (Home, Browse, Detail, List, Auth)
- [ ] Dashboard pages (Listings, Requests, Wishlist, History)
- [ ] AI components (ReadingAssistant, AudioPlayer, Recommender, ISBNScanner)
- [ ] Admin dashboard (Analytics, Moderation, Categories)
- [ ] Next.js API routes
- [ ] i18n translations (en.json + ar.json)
- [ ] Deployment configs (vercel.json + railway.toml + Dockerfile)

---

## AI Features Architecture

### 1. Book Recommender
- **Approach**: Hybrid (content-based + collaborative filtering)
- **Content-based**: sentence-transformer embeddings stored in pgvector; cosine similarity on title+description+category
- **Collaborative**: users who wishlisted/requested similar books → recommend
- **Trigger**: on book detail page sidebar + dashboard "For You" section

### 2. AI Reading Assistant (Reading Box)
- **Widget on book detail page**: expandable panel
- **Capabilities**: Summary, Key Themes, Who Should Read This, Similar Books
- **Model**: Claude claude-sonnet-4-6 via Anthropic SDK
- **Input**: book title + author + description + category

### 3. Audio Book Teaser (TTS)
- **Widget on book detail page**: play button → generates MP3 of book description
- **API**: OpenAI TTS (tts-1 model, voice: alloy/shimmer for AR)
- **Caching**: audio stored in Supabase Storage; URL cached in DB

### 4. ISBN Scanner / Autofill
- **On list-a-book form**: camera icon → reads ISBN barcode
- **API**: Google Books API + OpenLibrary fallback
- **Autofills**: title, author, category, cover image

### 5. Semantic Search
- **pgvector extension** on Supabase
- **Query flow**: user query → embed with sentence-transformers → cosine similarity search
- **Fallback**: PostgreSQL full-text search (tsvector)

---

## Database Schema (Key Tables)
- `users` (extends auth.users)
- `categories`
- `book_listings` (+ embedding vector column)
- `book_requests`
- `wishlist`
- `transactions`
- `notifications`
- `audio_cache`

---

## Done When
- [ ] `npm run dev` starts with no errors
- [ ] All 8 main pages render (Home, Browse, Detail, List, Auth x2, Dashboard, Admin)
- [ ] AI reading assistant returns summary for a book
- [ ] TTS plays audio on book detail page
- [ ] Recommender shows 6 related books
- [ ] Arabic RTL layout toggles correctly
- [ ] Supabase auth flow works (register → verify → dashboard)
