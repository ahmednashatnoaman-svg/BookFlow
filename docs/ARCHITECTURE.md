# BookFlow — System Architecture Document

## 1. Architecture Overview

BookFlow uses a **three-tier, microservice-adjacent** architecture deployed on managed cloud infrastructure.

```
┌────────────────────────────────────────────────────────────────────┐
│                         INTERNET / CDN                              │
│                    Vercel Global Edge Network                        │
└──────────────────────────┬─────────────────────────────────────────┘
                            │
┌──────────────────────────▼─────────────────────────────────────────┐
│                    FRONTEND TIER (Vercel)                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Next.js 14 App Router                           │    │
│  │                                                              │    │
│  │  Client Components:        Server Components:                │    │
│  │  - Header (auth state)     - HomePage (SSG)                  │    │
│  │  - BookFilters (state)     - BrowsePage (SSR)               │    │
│  │  - ReadingAssistant        - BookDetailPage (SSR+ISR)        │    │
│  │  - AudioPlayer             - DashboardPage (SSR)             │    │
│  │  - ISBNScanner             - AdminPage (SSR)                 │    │
│  │  - RequestModal                                              │    │
│  │  - Recommender             API Routes (Edge Functions):      │    │
│  │                            - /api/books (CRUD)               │    │
│  │  State Management:         - /api/requests                   │    │
│  │  - Zustand (client state)  - /api/categories                 │    │
│  │  - Supabase Realtime       - /api/ai/summarize               │    │
│  │  - React Query (cache)     - /api/ai/tts                     │    │
│  │                            - /api/ai/recommend               │    │
│  │  i18n:                     - /api/ai/isbn                    │    │
│  │  - next-intl               - /api/ai/chat                    │    │
│  │  - AR (RTL) / EN (LTR)     - /api/upload/image               │    │
│  │  - Cookie locale store     - /api/wishlist                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────┬───────────────────────────────────────┬──────────────────────┘
       │ Supabase JS SDK (SSR)                  │ HTTP (secret auth)
       │                                        │
┌──────▼──────────────────────┐    ┌───────────▼──────────────────────┐
│   DATA TIER (Supabase)       │    │   AI SERVICE TIER (Railway)       │
│                              │    │                                    │
│  PostgreSQL 16               │    │  FastAPI + Uvicorn                 │
│  ┌────────────────────────┐  │    │  ┌────────────────────────────┐   │
│  │   Tables               │  │    │  │  Routers:                   │   │
│  │   user_profiles        │  │    │  │  POST /recommend/similar    │   │
│  │   categories (12 seed) │  │    │  │  POST /recommend/for-you    │   │
│  │   book_listings        │  │    │  │  POST /recommend/embed      │   │
│  │     └ embedding(384)   │  │    │  │  POST /summarize/           │   │
│  │     └ fts tsvector     │  │    │  │  POST /summarize/chat       │   │
│  │   book_requests        │  │    │  │  POST /tts/                 │   │
│  │   wishlist             │  │    │  │  GET  /isbn/                │   │
│  │   transactions         │  │    │  └────────────────────────────┘   │
│  │   notifications        │  │    │                                    │
│  │   reports              │  │    │  Services:                         │
│  └────────────────────────┘  │    │  EmbeddingService                  │
│                               │    │    sentence-transformers           │
│  Extensions:                  │    │    all-MiniLM-L6-v2 (384-dim)      │
│  - pgvector                   │    │    LOADED ONCE at startup          │
│  - pg_trgm                    │    │                                    │
│                               │    │  External APIs:                    │
│  Functions (PL/pgSQL):        │    │  - Anthropic Claude claude-sonnet-4-6│
│  - accept_request()           │    │  - OpenAI TTS tts-1                │
│  - search_listings()          │    │  - Google Books API                │
│  - get_similar_books()        │    │  - OpenLibrary API (fallback)      │
│  - get_collaborative_recs()   │    │                                    │
│  - search_books_semantic()    │    │  Auth: x-service-secret header     │
│  - increment_view_count()     │    └────────────────────────────────────┘
│  - notify_wishlist_on_relist()│
│                               │
│  Row-Level Security:          │
│  - 8 tables with RLS          │
│  - 20+ policies               │
│                               │
│  Auth (Supabase Auth):        │
│  - Email + OTP                │
│  - JWT (7-day expiry)         │
│  - Auto profile trigger       │
│                               │
│  Storage Buckets:             │
│  - book-images (public)       │
│  - book-audio (public)        │
└───────────────────────────────┘
```

---

## 2. Data Flow Diagrams

### 2.1 Book Creation Flow
```
User → List-a-Book Form
  → ISBNScanner → /api/ai/isbn → Google Books → Pre-fill form
  → Upload images → /api/upload/image → Supabase Storage
  → Submit form → /api/books POST
      → Insert book_listings (Supabase)
      → Trigger background: AI Service /recommend/embed
          → sentence-transformers.encode(title + description)
          → UPDATE book_listings SET embedding = [...]
  → Redirect to book detail page
```

### 2.2 Exchange Request Flow
```
User A → Book Detail Page (User B's listing)
  → Click "Propose Exchange"
  → Select own book from dropdown
  → Add optional message
  → POST /api/requests
      → Validation: not own listing, no duplicate
      → INSERT book_requests (pending)
      → INSERT notification for User B
  
User B → Dashboard → Requests → "Accept"
  → PATCH /api/requests/:id { status: "accepted" }
      → RPC accept_request()
          → UPDATE request: status=accepted
          → UPDATE other requests: status=rejected
          → UPDATE listing: status=exchanged
          → INSERT transaction
          → INSERT notifications (accepted + rejected users)
  → Both users see each other's contact info
```

### 2.3 AI Reading Assistant Flow
```
User → Book Detail → Click "Analyze This Book"
  → GET /api/ai/summarize { listing_id }
  → Fetch book from Supabase
  → Check: book.ai_summary != null?
      → YES: return cached JSON immediately
      → NO:
          → Build prompt with title, author, description
          → POST to Anthropic claude-sonnet-4-6
          → Parse JSON response
          → UPDATE book_listings SET ai_summary = {...}
          → Return to client
  → ReadingAssistant renders: summary, themes, audience, mood
  → User can switch to "Chat" tab → ask Claude questions
```

### 2.4 Recommendation Flow
```
Book Detail Page mounts
  → POST /api/ai/recommend { listing_id }
  → Supabase RPC get_similar_books(source_listing_id, 6)
      → SELECT source embedding FROM book_listings WHERE id = source_id
      → SELECT all available listings (with embeddings)
      → ORDER BY embedding <=> source_embedding  (cosine distance)
      → LIMIT 6
  → Return array of similar books with similarity score
  → Recommender component renders 6 book cards
```

---

## 3. Technology Choices Rationale

| Decision | Alternatives Considered | Rationale |
|---|---|---|
| Next.js 14 App Router | Remix, Nuxt, CRA | SSR for SEO, ISR for book pages, built-in API routes |
| Supabase | Firebase, PlanetScale, Neon | Postgres + pgvector + Auth + Storage in one; generous free tier |
| FastAPI | Django, Express, Go | Python ecosystem for ML; async performance; auto-docs |
| sentence-transformers | OpenAI embeddings, Cohere | Local model = no API cost; all-MiniLM-L6-v2 is fast + accurate |
| pgvector | Pinecone, Weaviate | Co-located with Postgres; no extra service; RLS compatibility |
| Claude claude-sonnet-4-6 | GPT-4, Gemini | Best literary reasoning; structured JSON output reliability |
| OpenAI TTS | ElevenLabs, Google TTS | Simple API; supports Arabic (shimmer voice); MP3 output |
| Tailwind CSS | MUI, Ant Design, Chakra | Full customization; no runtime overhead; RTL support |
| shadcn/ui | Radix primitives alone | Pre-styled accessible components; copy-paste composability |
| next-intl | i18next, react-intl | Native Next.js App Router integration; minimal config |
| Zustand | Redux, Jotai, Context | Minimal boilerplate; TypeScript-first; no providers |

---

## 4. Security Architecture

```
AUTHENTICATION LAYER
  Supabase Auth JWT → verified by Supabase SDK on every request
  ↓
ROW-LEVEL SECURITY (Database)
  auth.uid() = user_id for mutations
  Public read for available listings
  Admin check via user_profiles.role
  ↓
API ROUTE PROTECTION
  createClient() reads session from cookies (SSR)
  Unauthorized → 401; Forbidden → 403
  ↓
STORAGE SECURITY
  book-images: public read, auth-only write
  book-audio: public read, service-role write (server-side only)
  ↓
AI SERVICE PROTECTION
  x-service-secret header on all routes
  Secret shared via Railway env → Vercel env
  Never exposed to browser
```

---

## 5. File & Folder Structure

```
BookFlow/
├── plan.md                         ← Master implementation plan
├── docs/
│   ├── SRS.md                      ← Software Requirements Specification
│   └── ARCHITECTURE.md             ← This document
├── frontend/                       ← Next.js 14 application
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vercel.json
│   ├── .env.local.example
│   ├── messages/
│   │   ├── en.json                 ← English translations
│   │   └── ar.json                 ← Arabic translations
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          ← Root layout (fonts, i18n, theme)
│       │   ├── globals.css
│       │   ├── page.tsx            ← Home page
│       │   ├── books/
│       │   │   ├── page.tsx        ← Browse page
│       │   │   └── [id]/page.tsx   ← Book detail page
│       │   ├── list-book/page.tsx  ← Create listing
│       │   ├── auth/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── dashboard/
│       │   │   ├── page.tsx        ← Dashboard overview
│       │   │   └── requests/page.tsx
│       │   ├── admin/
│       │   │   └── page.tsx        ← Admin dashboard
│       │   └── api/
│       │       ├── books/route.ts
│       │       ├── books/[id]/route.ts
│       │       ├── categories/route.ts
│       │       ├── requests/route.ts
│       │       ├── requests/[id]/route.ts
│       │       ├── upload/image/route.ts
│       │       └── ai/
│       │           ├── summarize/route.ts
│       │           ├── tts/route.ts
│       │           ├── recommend/route.ts
│       │           ├── isbn/route.ts
│       │           └── chat/route.ts
│       ├── components/
│       │   ├── layout/Header.tsx
│       │   ├── books/
│       │   │   ├── BookCard.tsx
│       │   │   └── BookFilters.tsx
│       │   ├── ai/
│       │   │   ├── ReadingAssistant.tsx
│       │   │   ├── AudioPlayer.tsx
│       │   │   ├── Recommender.tsx
│       │   │   └── ISBNScanner.tsx
│       │   ├── requests/
│       │   │   ├── RequestModal.tsx
│       │   │   └── RequestCard.tsx
│       │   └── admin/AdminCharts.tsx
│       ├── lib/
│       │   ├── supabase/client.ts
│       │   ├── supabase/server.ts
│       │   ├── supabase/middleware.ts
│       │   ├── api.ts
│       │   └── utils.ts
│       ├── types/index.ts
│       ├── middleware.ts
│       └── i18n/request.ts
├── ai-service/                     ← FastAPI AI microservice
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.toml
│   ├── .env.example
│   ├── models/schemas.py
│   ├── services/
│   │   ├── embeddings.py
│   │   ├── tts_service.py
│   │   └── isbn_service.py
│   └── routers/
│       ├── recommendations.py
│       ├── summarization.py
│       ├── tts.py
│       └── isbn.py
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_enable_pgvector.sql
        ├── 003_rls_policies.sql
        └── 004_functions.sql
```

---

## 6. Deployment Architecture

```
DEVELOPMENT
  └── next dev (localhost:3000)
  └── uvicorn main:app --reload (localhost:8000)
  └── Supabase local (supabase start) OR remote project

PRODUCTION
  Frontend → Vercel
    Branch: main → auto-deploy
    Preview branches for PRs
    Environment variables via Vercel dashboard
    Edge functions for API routes
    
  AI Service → Railway
    Docker build from ai-service/Dockerfile
    railway.toml config
    Horizontal scaling: up to 4 replicas
    Persistent disk for model cache (/root/.cache)
    
  Database → Supabase Cloud
    Region: Middle East (me-central-1) for latency
    Daily backups enabled
    Connection pooling via pgBouncer (port 6543)
    
CI/CD Pipeline:
  GitHub → Vercel (auto-deploy on push to main)
  GitHub → Railway (auto-deploy AI service on push)
  Supabase migrations: manual via supabase db push
```

---

*Architecture Document v1.0 — BookFlow Platform*
