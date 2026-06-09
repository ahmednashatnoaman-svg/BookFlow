# BookFlow — Project Summary

> AI-Enhanced Peer-to-Peer Book Exchange Platform
> GenAI Hackathon — "Idea to Prototype" Challenge

---

## Overview

BookFlow is a full-stack marketplace where users in the MENA region can buy, sell, and exchange second-hand books, enhanced with AI features that make discovery intelligent and effortless. The platform is bilingual (Arabic RTL + English LTR) and powered by Claude, pgvector, and sentence-transformers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL 16 + pgvector + Auth + Storage + Realtime) |
| AI Service | FastAPI (Python) on Railway |
| AI Models | Claude claude-sonnet-4-6 (chat + summarization), sentence-transformers all-MiniLM-L6-v2 (embeddings), OpenAI TTS (audio) |
| i18n | next-intl — Arabic (RTL) + English (LTR) |
| Auth | Supabase Auth (email/password + OTP) |
| Deployment | Vercel (frontend) + Railway (AI service) |

---

## Architecture

```
User Browser
    │
    ▼
Next.js 14 (Vercel)
├── App Router pages
├── API Routes (/api/*)
└── Supabase JS Client
         │
         ├──────────────────────────────────────┐
         ▼                                      ▼
Supabase (PostgreSQL + pgvector)       FastAPI AI Service (Railway)
├── user_profiles                      ├── /summarize   → Claude claude-sonnet-4-6
├── book_listings (+embedding)         ├── /tts         → OpenAI TTS → Storage
├── book_requests                      ├── /recommend   → pgvector similarity
├── wishlist                           ├── /isbn        → Google Books API
├── transactions                       └── /embeddings  → sentence-transformers
├── notifications
├── categories (12)
└── reports
```

Architecture diagram: https://app.eraser.io/workspace/6Ixh5SP3Na5IyxrYWAmr

---

## Database

### Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | Extends `auth.users` — name, phone, city, bio, role (user/admin) |
| `categories` | 12 seeded categories, bilingual (name_en, name_ar, slug, icon) |
| `book_listings` | Core listing — title, author, ISBN, condition, type, price, images, embedding vector (384-dim), ai_summary, audio_url |
| `book_requests` | Exchange/purchase requests with status (pending/accepted/rejected) |
| `wishlist` | User → listing saves |
| `transactions` | Completed exchanges/sales record |
| `notifications` | In-app notifications (request received/accepted/rejected/wishlist) |
| `reports` | User-reported listings (admin moderation) |

### Migrations

| File | Contents |
|------|---------|
| `001_initial_schema.sql` | All core tables, indexes, triggers, 12 category seeds |
| `002_enable_pgvector.sql` | `CREATE EXTENSION vector`, embedding column on book_listings |
| `003_rls_policies.sql` | Row Level Security policies for all tables |
| `004_functions.sql` | RPC functions (accept_request, search, recommendations, semantic search) |

### RPC Functions

| Function | Description |
|----------|-------------|
| `accept_request(request_id)` | Accepts request → rejects others → marks listing sold/exchanged → creates transaction → sends notifications |
| `search_listings(query, filters)` | Full-text search with category, condition, price, city, language, listing_type filters |
| `get_similar_books(listing_id, limit)` | pgvector cosine similarity — content-based recommendations |
| `get_collaborative_recommendations(user_id)` | Collaborative filtering based on wishlist and transaction history |
| `search_books_semantic(query_embedding, limit)` | Semantic search using 384-dim vector similarity |
| `handle_new_user()` | Trigger: auto-creates user_profile row on signup |

---

## Frontend Pages

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing page | Hero, AI features overview, trending books, how it works |
| `/books` | Browse Books | Sidebar filters (category, condition, price, city, language), book grid |
| `/books/[id]` | Book Detail | Full listing + AI Reading Assistant + Audio Player + Recommender |
| `/chat` | AI Chat Agent | Claude-powered conversational book search with tool use |
| `/list-book` | Create Listing | Multi-step form with ISBN autofill scanner |
| `/auth/login` | Sign In | Email/password login |
| `/auth/register` | Register | Sign up with name, email, password, city |

### Dashboard Routes (authenticated)

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Overview | Stats cards: active listings, exchanges completed, wishlist count, pending requests |
| `/dashboard/listings` | My Listings | CRUD table — status toggle (available/unavailable), edit, delete |
| `/dashboard/wishlist` | Wishlist | Saved books grid with remove option |
| `/dashboard/requests` | Requests | Incoming (accept/reject) and outgoing request management |
| `/dashboard/history` | History | Transaction log with role (seller/buyer), book info, date |
| `/dashboard/profile` | Profile | Edit name, phone, city, bio, avatar |

### Admin Routes (admin role)

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Admin Overview | Platform stats: total users, listings, exchanges, growth charts |
| `/admin/users` | User Management | User table with role, listing count, ban/unban actions |
| `/admin/listings` | Listings Moderation | All listings table with status control |
| `/admin/categories` | Categories | Full CRUD — add/edit/delete categories with bilingual names |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/books` | List/create book listings |
| GET/PUT/DELETE | `/api/books/[id]` | Get/update/delete a listing |
| GET | `/api/books/my` | Current user's own listings |
| GET/POST | `/api/wishlist` | Get wishlist / add to wishlist |
| DELETE | `/api/wishlist/[id]` | Remove from wishlist |
| GET/POST | `/api/requests` | List/create exchange requests |
| PUT | `/api/requests/[id]` | Accept or reject a request |
| GET | `/api/transactions` | Transaction history (with role: seller/buyer) |
| GET | `/api/categories` | List all categories |
| POST | `/api/upload/image` | Upload book image to Supabase Storage |
| POST | `/api/ai/agent` | AI Chat Agent (Claude tool use) |
| POST | `/api/ai/summarize` | Generate AI summary for a book |
| POST | `/api/ai/chat` | Book Q&A chat (Reading Assistant) |
| POST | `/api/ai/recommend` | Fetch similar/recommended books |
| GET | `/api/ai/isbn` | ISBN lookup → autofill book metadata |
| POST | `/api/ai/tts` | Generate audio preview (TTS) |

---

## AI Features

### 1. AI Chat Agent (`/chat`)
- File: [frontend/src/app/api/ai/agent/route.ts](frontend/src/app/api/ai/agent/route.ts)
- Claude claude-sonnet-4-6 with `search_books` tool — natural language → structured Supabase query
- Supports: price ranges, condition, listing_type (sale/exchange), city, language, sort order
- Agentic loop: up to 5 tool-use iterations for complex queries
- UI: conversational interface with inline book result cards and suggested query chips

### 2. AI Reading Assistant
- File: [frontend/src/components/ai/ReadingAssistant.tsx](frontend/src/components/ai/ReadingAssistant.tsx)
- Appears on every Book Detail page
- Tabs: AI Summary, Key Themes, Target Audience, Mood, Similar Books, Reading Time
- Q&A chat: ask any question about the book, Claude responds with context
- Summaries cached in `book_listings.ai_summary` (JSONB) — generated once, reused forever

### 3. Audio Book Preview (TTS)
- File: [frontend/src/components/ai/AudioPlayer.tsx](frontend/src/components/ai/AudioPlayer.tsx)
- AI service: [ai-service/routers/tts.py](ai-service/routers/tts.py)
- Converts book description/summary to speech via OpenAI TTS
- MP3 stored in Supabase Storage, URL cached in `book_listings.audio_url`
- Custom audio player component with waveform visualization

### 4. ISBN Autofill Scanner
- File: [frontend/src/components/ai/ISBNScanner.tsx](frontend/src/components/ai/ISBNScanner.tsx)
- AI service: [ai-service/routers/isbn.py](ai-service/routers/isbn.py)
- Camera-based barcode scan OR manual ISBN entry
- Google Books API primary → OpenLibrary fallback
- Auto-fills: title, author, publisher, year, cover image, description

### 5. Semantic Search + Recommender
- File: [frontend/src/components/ai/Recommender.tsx](frontend/src/components/ai/Recommender.tsx)
- AI service: [ai-service/services/embeddings.py](ai-service/services/embeddings.py)
- sentence-transformers `all-MiniLM-L6-v2` → 384-dim embeddings stored in pgvector
- Content-based: `get_similar_books()` cosine similarity on embedding column
- Collaborative: `get_collaborative_recommendations()` based on wishlist + transaction overlap
- Semantic search: `search_books_semantic()` — query embedded at search time, vector-matched against all listings

---

## FastAPI AI Service

**Location:** [ai-service/](ai-service/) | **Deploy:** Railway + Docker

| File | Description |
|------|-------------|
| [main.py](ai-service/main.py) | FastAPI app entry, CORS, router registration |
| [routers/summarization.py](ai-service/routers/summarization.py) | Claude claude-sonnet-4-6 book summarization + Q&A |
| [routers/tts.py](ai-service/routers/tts.py) | OpenAI TTS → Supabase Storage upload |
| [routers/recommendations.py](ai-service/routers/recommendations.py) | pgvector similarity queries |
| [routers/isbn.py](ai-service/routers/isbn.py) | Google Books + OpenLibrary ISBN lookup |
| [services/embeddings.py](ai-service/services/embeddings.py) | sentence-transformers embedding generation |
| [services/isbn_service.py](ai-service/services/isbn_service.py) | ISBN fetch + metadata normalization |
| [services/tts_service.py](ai-service/services/tts_service.py) | TTS generation + storage logic |
| [models/schemas.py](ai-service/models/schemas.py) | Pydantic request/response models |
| [Dockerfile](ai-service/Dockerfile) | Container build for Railway |
| [railway.toml](ai-service/railway.toml) | Railway deployment config |

---

## UI Design — Google Stitch Screens

**Project:** "BookFlow User Dashboard" (ID: `14504358302559516607`)
**Design System:** "BookFlow Narrative" — dark navy, glassmorphism, violet/emerald/rose
**Design tokens:** Background `#0F172A` · Violet AI `#8B5CF6` · Emerald active `#10B981` · Rose error `#F43F5E`

| Screen | Title | Screen ID |
|--------|-------|-----------|
| 🏠 Landing | BookFlow Landing Page - Discover Your Next Read | `49aaf94fbf944c388c56224b8af37cab` |
| 📚 Browse | Browse Books - BookFlow | `4c942e24be894e32b99b5599cc6c63a6` |
| 🤖 AI Chat | BookFlow AI Agent - Smart Search | `ebd8f2a6f08e42e89cd4c17452c6be0a` |
| 📖 Book Detail | The Martian - Book Details \| BookFlow | `ed7067af1ce948439e99c4924fd02966` |
| 🔐 Sign In | Sign In - BookFlow | `085c2019faf44aca83b30a53ab662ec0` |
| 🔐 Sign Up | Sign Up - BookFlow | `490826353f31443d8c9deb686d3640c4` |
| 📊 Dashboard | Ahmad's Dashboard - BookFlow | `15077cbff2af4ffd98f26736668e3731` |
| 🎨 Logo | BookFlow Logo | `e8987b28c3294f0a828a16b2ce0b4fb2` |

Each screen has a hosted screenshot and downloadable HTML/CSS export available in the Stitch project.

Design tokens file: [frontend/src/lib/design-tokens.json](frontend/src/lib/design-tokens.json)
Figma plugin (fallback generator): [figma-plugin/code.js](figma-plugin/code.js)

---

## Frontend Components

| Component | File | Description |
|-----------|------|-------------|
| `Header` | [layout/Header.tsx](frontend/src/components/layout/Header.tsx) | Nav with auth state, locale switcher, mobile menu |
| `BookCard` | [books/BookCard.tsx](frontend/src/components/books/BookCard.tsx) | Grid card with condition badge, price, wishlist toggle |
| `BookFilters` | [books/BookFilters.tsx](frontend/src/components/books/BookFilters.tsx) | Sidebar filters: category, condition, price range, city |
| `ReadingAssistant` | [ai/ReadingAssistant.tsx](frontend/src/components/ai/ReadingAssistant.tsx) | Claude Q&A + summary tabs on Book Detail |
| `AudioPlayer` | [ai/AudioPlayer.tsx](frontend/src/components/ai/AudioPlayer.tsx) | TTS playback with waveform |
| `ISBNScanner` | [ai/ISBNScanner.tsx](frontend/src/components/ai/ISBNScanner.tsx) | Camera barcode scanner + manual fallback |
| `Recommender` | [ai/Recommender.tsx](frontend/src/components/ai/Recommender.tsx) | Similar + collaborative book suggestions |
| `AdminCharts` | [admin/AdminCharts.tsx](frontend/src/components/admin/AdminCharts.tsx) | Growth charts, category breakdown for admin |
| `RequestCard` | [requests/RequestCard.tsx](frontend/src/components/requests/RequestCard.tsx) | Request list item with accept/reject actions |
| `RequestModal` | [requests/RequestModal.tsx](frontend/src/components/requests/RequestModal.tsx) | Exchange request creation modal |

---

## TypeScript Types

Defined in [frontend/src/types/index.ts](frontend/src/types/index.ts):

- `BookListing` — full listing shape with optional owner, is_wishlisted, request_count
- `BookRequest` — request with requester, listing, offer_listing relations
- `UserProfile` — profile with listing_count, exchange_count
- `Category` — bilingual (name_en, name_ar, slug, icon)
- `Transaction` — with seller, buyer, listing relations
- `Notification` — typed notification events
- `AIBookSummary` — summary, key_themes, mood, similar_books, reading_time_estimate
- `BookRecommendation` — listing + score + reason
- `SearchFilters` — full filter shape for search API
- `AdminStats` — platform analytics shape
- Enums: `BookCondition`, `ListingType`, `ListingStatus`, `RequestStatus`, `UserRole`, `Locale`

---

## i18n — Bilingual Support

- Framework: `next-intl`
- Locales: `en` (LTR) + `ar` (RTL)
- Message files: `frontend/.next/server/_rsc_messages_ar_json.js` and `_rsc_messages_en_json.js`
- Middleware: [frontend/src/middleware.ts](frontend/src/middleware.ts) — locale detection + redirect
- i18n config: [frontend/src/i18n/request.ts](frontend/src/i18n/request.ts)
- Categories have both `name_en` and `name_ar` columns in DB

---

## File Structure

```
BookFlow/
├── frontend/                        # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx             # Landing
│       │   ├── layout.tsx           # Root layout + i18n provider
│       │   ├── globals.css
│       │   ├── books/               # Browse + Detail
│       │   ├── chat/                # AI Agent chat
│       │   ├── list-book/           # Create listing
│       │   ├── auth/                # Login + Register
│       │   ├── dashboard/           # 5 dashboard sub-pages
│       │   ├── admin/               # 3 admin sub-pages
│       │   └── api/                 # 17 API route handlers
│       ├── components/
│       │   ├── ai/                  # ReadingAssistant, AudioPlayer, ISBNScanner, Recommender
│       │   ├── books/               # BookCard, BookFilters
│       │   ├── layout/              # Header
│       │   ├── requests/            # RequestCard, RequestModal
│       │   └── admin/               # AdminCharts
│       ├── lib/
│       │   ├── api.ts               # Typed API client helpers
│       │   ├── design-tokens.json   # Figma Tokens Studio format
│       │   └── supabase/            # client.ts, server.ts, middleware.ts
│       ├── types/index.ts           # All TypeScript types + enums
│       ├── i18n/request.ts
│       └── middleware.ts
│
├── ai-service/                      # FastAPI Python microservice (Railway)
│   ├── main.py
│   ├── routers/                     # isbn, recommendations, summarization, tts
│   ├── services/                    # embeddings, isbn_service, tts_service
│   ├── models/schemas.py
│   ├── Dockerfile
│   ├── railway.toml
│   └── requirements.txt
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # Tables, triggers, 12 category seeds
│       ├── 002_enable_pgvector.sql  # pgvector extension + embedding column
│       ├── 003_rls_policies.sql     # Row Level Security policies
│       └── 004_functions.sql        # RPC functions + helper triggers
│
├── figma-plugin/                    # Figma plugin (design fallback)
│   ├── manifest.json
│   └── code.js                      # 986-line plugin generating all BookFlow screens
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── SRS.md
│
├── plan.md                          # Master implementation plan
├── GenAi_Hackathon.txt              # Original hackathon brief
└── PROJECT_SUMMARY.md               # This file
```

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | Vercel | Auto-deploy from git, env vars in Vercel dashboard |
| AI Service | Railway | `railway.toml` + `Dockerfile` in `ai-service/` |
| Database | Supabase cloud | Migrations applied via Supabase CLI |
| Storage | Supabase Storage | Book images + TTS audio MP3s |

### Environment Variables

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AI_SERVICE_URL=
```

**AI Service (`.env.example`):**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

## What's Built — Checklist

### Core Marketplace
- [x] Book listings (create, read, update, delete, status toggle)
- [x] Browse with advanced filters (category, condition, price, city, language, type)
- [x] Exchange request flow (send → accept/reject → auto-complete transaction)
- [x] Wishlist (save/unsave books)
- [x] Transaction history (buyer + seller views)
- [x] Notifications (request received/accepted/rejected)
- [x] Image upload to Supabase Storage
- [x] User profile (edit name, phone, city, bio)

### AI Features
- [x] AI Chat Agent — Claude claude-sonnet-4-6 + tool use (natural language → structured search)
- [x] AI Reading Assistant — book summary, key themes, mood, Q&A chat per listing
- [x] Audio Book Preview — OpenAI TTS → MP3 → Supabase Storage (cached)
- [x] ISBN Autofill Scanner — barcode camera scan + Google Books / OpenLibrary
- [x] Semantic Search — pgvector 384-dim embeddings, cosine similarity
- [x] Book Recommender — content-based (pgvector) + collaborative filtering

### Admin Panel
- [x] Admin overview with growth charts and platform stats
- [x] User management table (view, role management)
- [x] Listings moderation table
- [x] Category CRUD (add/edit/delete with bilingual names)

### Database
- [x] 8 core tables with proper indexes and foreign keys
- [x] Row Level Security policies for all tables
- [x] 6 RPC functions (accept_request, search, similarity, collaborative, semantic search, trigger)
- [x] pgvector extension with 384-dim embedding column
- [x] 12 seeded categories (bilingual EN/AR)
- [x] Auto-profile creation trigger on signup

### i18n
- [x] Arabic (RTL) + English (LTR) with next-intl
- [x] Bilingual category names in DB
- [x] Middleware-based locale detection

### UI Design (Google Stitch)
- [x] Landing Page
- [x] Browse Books
- [x] AI Chat Agent
- [x] Book Detail
- [x] Sign In
- [x] Sign Up
- [x] Dashboard
- [x] Logo

### Docs
- [x] System Requirements Specification (`docs/SRS.md`)
- [x] Architecture document (`docs/ARCHITECTURE.md`)
- [x] Architecture diagram (Eraser)
- [x] Master plan (`plan.md`)
- [x] Design tokens (Figma Tokens Studio format)
- [x] Figma plugin (code-based design generator fallback)
