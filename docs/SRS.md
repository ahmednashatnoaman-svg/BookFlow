# Software Requirements Specification (SRS)
## BookFlow — AI-Enhanced Peer-to-Peer Book Exchange Platform

**Version:** 1.0  
**Date:** June 2026  
**Status:** Final  

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and non-functional requirements for BookFlow, an AI-enhanced peer-to-peer book exchange web platform targeting the MENA region. It serves as the authoritative reference for design, development, testing, and deployment.

### 1.2 Scope
BookFlow enables users to list, discover, sell, and exchange used books. It incorporates AI capabilities (recommendations, audio TTS, reading assistant, semantic search, ISBN autofill) to improve the user experience. The system supports Arabic (RTL) and English.

### 1.3 Definitions
| Term | Definition |
|---|---|
| Guest | Unauthenticated visitor |
| Registered User | Authenticated account holder |
| Admin | Platform administrator with moderation privileges |
| Listing | A book offered for sale or exchange |
| Request | A contact or exchange proposal by a Registered User |
| Exchange | Swap of two books between two Registered Users |
| TTS | Text-to-Speech audio narration |
| pgvector | PostgreSQL extension for vector similarity search |
| Embedding | Numerical vector representing a book's semantic content |

### 1.4 System Overview
BookFlow is a three-tier web application:
- **Presentation Tier**: Next.js 14 (React) frontend on Vercel
- **Logic Tier**: Next.js API Routes + FastAPI AI microservice on Railway
- **Data Tier**: Supabase (PostgreSQL + pgvector + Auth + Storage)

---

## 2. Overall Description

### 2.1 Product Perspective
BookFlow is a standalone SaaS web platform. It integrates with:
- **Supabase** (Auth, Database, Storage, Realtime)
- **Claude API** (Anthropic) for book summarization and chat
- **OpenAI TTS** for audio generation
- **Google Books API / OpenLibrary** for ISBN metadata
- **sentence-transformers** for local embedding generation

### 2.2 User Classes
| Class | Description | Access Level |
|---|---|---|
| Guest | Anyone browsing without an account | Read-only: browse, search, view details |
| Registered User | Authenticated user | Full: list, request, exchange, wishlist |
| Admin | Platform operator | Full + moderation + analytics |

### 2.3 Operating Environment
- **Browsers**: Chrome 100+, Safari 15+, Firefox 100+, Edge 100+
- **Devices**: Mobile (360px+), Tablet (768px+), Desktop (1024px+)
- **Languages**: Arabic (RTL), English (LTR)
- **Connection**: Works on 4G mobile (target <3s LCP)

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-01 | Register with email or phone | Must | OTP sent within 30s; duplicate email blocked; JWT issued |
| FR-02 | Login with email+password | Must | Correct credentials → JWT; invalid → specific error |
| FR-03 | Role-Based Access Control | Must | Guest/User/Admin roles enforced at API + DB level |
| FR-04 | Auto-create user profile | Must | On auth.users INSERT, user_profiles row created |
| FR-05 | Supabase RLS enforcement | Must | No cross-user data access possible |

### 3.2 Book Listings

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-10 | Create listing | Must | Required: title, author, category, condition, type; up to 5 images |
| FR-11 | Upload photos | Must | Each image <5MB; stored in Supabase Storage; WebP preferred |
| FR-12 | Set listing type | Must | "For Sale" (price required) or "For Exchange" |
| FR-13 | Edit own listing | Must | All fields editable; status dropdown |
| FR-14 | Delete own listing | Must | Soft-delete or hard-delete with cascade |
| FR-15 | Mark as sold/exchanged/unavailable | Must | Status update triggers wishlist notifications |
| FR-16 | ISBN autofill | Could | ISBN → Google Books API → pre-fill form fields + cover |

### 3.3 Search & Discovery

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-20 | Full-text search | Must | tsvector index on title+author+description; <500ms |
| FR-21 | Filter by condition | Must | Multi-select: new/good/acceptable/poor |
| FR-22 | Filter by listing type | Must | sale or exchange toggle |
| FR-23 | Filter by category | Must | Single-select from categories table |
| FR-24 | Filter by price range | Should | Min/max price inputs |
| FR-25 | Sort results | Must | Newest, price asc/desc, most relevant |
| FR-26 | Semantic search | Could | pgvector cosine similarity via sentence-transformer embeddings |
| FR-27 | Paginated results | Must | 24 per page; "Load More" button |

### 3.4 Exchange & Contact Requests

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-30 | Send contact request | Must | Authenticated user sends to any available listing (not own) |
| FR-31 | Propose exchange | Must | Select own available book as swap offer |
| FR-32 | Optional message | Should | Max 500 chars; stored with request |
| FR-33 | Block duplicate requests | Must | One request per (listing, requester) pair |
| FR-34 | Accept request | Must | accept_request() function: auto-reject others; mark listing sold/exchanged; create transaction |
| FR-35 | Reject request | Must | Status → rejected; requester notified |
| FR-36 | Notify on status change | Must | In-app notification row inserted |
| FR-37 | Reveal contact info after accept | Must | Accepted → requester can see seller contact |

### 3.5 Wishlist

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-40 | Add to wishlist | Should | Per-user, per-listing toggle |
| FR-41 | Remove from wishlist | Should | DELETE from wishlist |
| FR-42 | Wishlist view | Should | Grid of wishlisted books |
| FR-43 | Notification on relist | Could | DB trigger: listing status → available again → notify wishlist users |

### 3.6 Transaction History

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-50 | View completed transactions | Should | List with: book, other party, date, type |
| FR-51 | Transaction record auto-created | Must | accept_request() creates transaction row |

### 3.7 AI Features

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-60 | AI Reading Assistant | Should | Claude claude-sonnet-4-6: summary, themes, audience, mood, reading time |
| FR-61 | AI Chat about book | Should | Claude-powered Q&A widget on book detail page |
| FR-62 | TTS Audio Preview | Should | OpenAI TTS → MP3 → Supabase Storage → cached URL |
| FR-63 | Book Recommender | Should | pgvector get_similar_books() + collaborative filtering |
| FR-64 | ISBN Autofill | Could | Google Books API / OpenLibrary lookup |
| FR-65 | Background Embedding | Could | FastAPI: on listing create → embed title+description → store in pgvector |

### 3.8 Notifications

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-70 | In-app notification bell | Should | Unread count badge on header bell icon |
| FR-71 | Notification types | Must | request_received, request_accepted, request_rejected, wishlist_available |
| FR-72 | Mark as read | Should | Click → mark individual or all as read |

### 3.9 Admin

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-80 | Admin role check | Must | RBAC: role='admin' in user_profiles |
| FR-81 | Analytics dashboard | Should | Total listings, users, exchanges, sales; category charts |
| FR-82 | Manage categories | Must | CRUD on categories table |
| FR-83 | Moderate listings | Must | View, edit, remove any listing |
| FR-84 | Manage users | Must | View, suspend, change role |
| FR-85 | Resolve reports | Should | Mark reports as resolved |

### 3.10 Internationalization

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-90 | Arabic (RTL) support | Must | dir="rtl", font-family: Noto Sans Arabic, all UI elements mirrored |
| FR-91 | English (LTR) support | Must | Default locale |
| FR-92 | Locale toggle | Must | Cookie-based; persists across sessions |
| FR-93 | Bilingual content | Must | Book categories: name_en + name_ar stored |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page LCP < 3 seconds on 4G mobile
- Search query response < 500ms (P95)
- TTS generation < 10 seconds (first time); cached on repeat
- AI summary < 5 seconds
- Image upload: auto-compress to <500KB WebP

### 4.2 Security
- Supabase RLS on all tables (no raw SQL from frontend)
- HTTPS enforced (Vercel SSL)
- JWT tokens: 7-day expiry with auto-refresh
- Rate limiting on AI endpoints (100 req/user/day via Vercel Edge)
- File upload: type check (image/*, audio/*), size limit 5MB
- SQL injection: impossible via parameterized Supabase client
- XSS: React escaping + CSP headers

### 4.3 Scalability
- Vercel auto-scales frontend (serverless)
- Supabase connection pooling (pgBouncer)
- Railway scales AI service horizontally
- pgvector IVFFLAT index handles 100K+ listings

### 4.4 Availability
- Target: 99.5% uptime
- Vercel: global CDN, zero-downtime deploys
- Supabase: managed high-availability PostgreSQL
- Railway: automatic restarts on failure

### 4.5 Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML (header, nav, main, article)
- ARIA labels on interactive elements
- Keyboard navigable (tab order, focus rings)
- Color contrast ratio ≥ 4.5:1

### 4.6 Maintainability
- TypeScript strict mode on frontend
- Python type hints on AI service
- Pydantic models for all API schemas
- Environment variables for all secrets (.env.local)
- Database changes via versioned migration files

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│   Browser (Desktop/Mobile) — Arabic RTL + English LTR        │
└─────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│              FRONTEND  (Vercel CDN + Edge)                    │
│  Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Pages   │ │Components│ │ API Routes│ │  next-intl   │   │
│  │ Home     │ │BookCard  │ │/api/books │ │  AR / EN     │   │
│  │ Browse   │ │AIAssist  │ │/api/ai/*  │ │  RTL Support │   │
│  │ Detail   │ │AudioPlay │ │/api/req/* │ └──────────────┘   │
│  │ Dashboard│ │Recomm.   │ │/api/upload│                     │
│  │ Admin    │ │ISBNScan  │ └──────────┘                      │
│  └──────────┘ └──────────┘                                   │
└─────────┬──────────────────────────┬────────────────────────┘
          │ Supabase JS Client        │ Internal HTTP (secret)
┌─────────▼──────────────┐  ┌───────▼────────────────────────┐
│   SUPABASE (Backend)    │  │    AI MICROSERVICE (Railway)    │
│  PostgreSQL 16          │  │    FastAPI + Python 3.11        │
│  ┌─────────────────┐   │  │  ┌─────────────────────────┐   │
│  │ Tables (8)      │   │  │  │ /recommend/similar       │   │
│  │ user_profiles   │   │  │  │ /recommend/for-you       │   │
│  │ book_listings   │   │  │  │ /recommend/embed         │   │
│  │  + embedding    │   │  │  │ /summarize/              │   │
│  │    vector(384)  │   │  │  │ /summarize/chat          │   │
│  │ book_requests   │   │  │  │ /tts/                    │   │
│  │ wishlist        │   │  │  │ /isbn/                   │   │
│  │ transactions    │   │  │  └─────────────────────────┘   │
│  │ notifications   │   │  │  sentence-transformers (local)  │
│  │ categories      │   │  │  Anthropic Claude API           │
│  │ reports         │   │  │  OpenAI TTS API                 │
│  └─────────────────┘   │  │  Google Books API               │
│  pgvector extension     │  └────────────────────────────────┘
│  Row-Level Security     │
│  Supabase Auth          │
│  Supabase Storage       │
│   book-images bucket    │
│   book-audio bucket     │
└────────────────────────┘
```

### 5.2 AI Pipeline Architecture

```
User Action → Book Detail Page

ISBN Autofill Flow:
  User types ISBN → /api/ai/isbn → Google Books API → Pre-fill form

Embedding Flow (background):
  Listing created → POST /api/books → AI service /recommend/embed
  → sentence-transformers all-MiniLM-L6-v2 (384-dim)
  → pgvector UPDATE book_listings SET embedding = [...]

Summary/Chat Flow:
  Click "Analyze" → /api/ai/summarize
  → Fetch book from Supabase
  → Check ai_summary cache
  → If miss: Claude claude-sonnet-4-6 → JSON parse
  → Cache in ai_summary JSONB column
  → Return to client

TTS Flow:
  Click "Generate Audio" → /api/ai/tts
  → Check audio_url cache in Supabase
  → If miss: OpenAI TTS tts-1 → MP3 bytes
  → Upload to Supabase Storage (book-audio/listing_id.mp3)
  → Update audio_url on listing
  → Return public URL

Recommendation Flow:
  Page load → /api/ai/recommend → Supabase RPC get_similar_books()
  → pgvector cosine similarity (embedding <=> source_embedding)
  → Return top-6 similar listings with similarity score

Collaborative Filtering Flow:
  Dashboard load → /api/ai/recommend → RPC get_collaborative_recommendations()
  → Find users with overlapping wishlist
  → Return their other wishlisted books
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────────┐
│  auth.users     │         │   categories          │
│  (Supabase)     │         │   ─────────────────── │
│  id (PK)        │         │   id UUID PK          │
│  email          │         │   name_en TEXT        │
│  phone          │         │   name_ar TEXT        │
└────────┬────────┘         │   slug TEXT UNIQUE    │
         │ 1:1              │   icon TEXT           │
         ▼                  └──────────┬────────────┘
┌─────────────────────┐               │
│  user_profiles      │               │ 1:N
│  ──────────────── ──│     ┌─────────▼──────────────────────────┐
│  id UUID PK FK      │◄────│   book_listings                     │
│  email TEXT         │ N:1 │   ────────────────────────────────  │
│  full_name TEXT     │     │   id UUID PK                        │
│  avatar_url TEXT    │     │   user_id UUID FK → user_profiles   │
│  role TEXT          │     │   title TEXT                        │
│  city TEXT          │     │   author TEXT                       │
└──────┬──────────────┘     │   isbn TEXT                         │
       │                    │   category_id UUID FK               │
       │ 1:N                │   condition TEXT                    │
       │                    │   listing_type TEXT (sale/exchange) │
       │          ┌─────────│   status TEXT (available/sold/...)  │
       │          │         │   price NUMERIC                     │
       │          │         │   images TEXT[]                     │
       │          │         │   cover_image TEXT                  │
       │          │         │   audio_url TEXT (TTS cache)        │
       │          │         │   ai_summary JSONB (Claude cache)   │
       │          │         │   embedding VECTOR(384) (pgvector)  │
       │          │         │   fts TSVECTOR (full-text index)    │
       │          │         │   view_count INT                    │
       │          │         └─────────────────────────────────────┘
       │          │                    │
       │          │ N:1                │ 1:N
       │   ┌──────▼───────────┐       │
       │   │  book_requests   │       │
       │   │  ──────────────  │       │
       │   │  id UUID PK      │       │
       │   │  listing_id FK   │◄──────┘
       │   │  requester_id FK │◄──── user_profiles
       │   │  offer_listing FK│ (optional exchange offer)
       │   │  message TEXT    │
       │   │  status TEXT     │
       │   └──────┬───────────┘
       │          │ 1:1
       │   ┌──────▼────────────┐   ┌──────────────────┐
       │   │  transactions     │   │    wishlist       │
       │   │  ─────────────────│   │  ──────────────── │
       │   │  id UUID PK       │   │  id UUID PK       │
       │   │  listing_id FK    │   │  user_id FK       │
       │   │  seller_id FK     │   │  listing_id FK    │
       │   │  buyer_id FK      │   │  UNIQUE(user,lst) │
       │   │  request_id FK    │   └──────────────────┘
       │   │  type TEXT        │
       │   └───────────────────┘
       │
       └──── notifications
              id UUID PK
              user_id FK
              type TEXT
              title TEXT
              body TEXT
              data JSONB
              read BOOLEAN
```

### 6.2 Indexes
| Table | Index | Type | Purpose |
|---|---|---|---|
| book_listings | idx_listings_fts | GIN | Full-text search |
| book_listings | idx_listings_embedding | IVFFLAT | Vector similarity search |
| book_listings | idx_listings_status | BTREE | Filter by status |
| book_listings | idx_listings_created | BTREE DESC | Sort by newest |
| book_requests | idx_requests_listing | BTREE | Join listings |
| notifications | idx_notifications_user | BTREE | Per-user unread |

---

## 7. API Documentation

### Base URL
- **Production**: `https://book-flow-umber.vercel.app/api`
- **Development**: `http://localhost:3000/api`
- **AI Service**: `https://bookflow-ai.railway.app`

### Authentication
All protected endpoints require Supabase session cookie (set automatically by `@supabase/ssr`).

---

### 7.1 Books API

#### `GET /api/books`
Browse listings with filters.

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| query | string | Full-text search query |
| category_id | UUID | Filter by category |
| condition | string | Comma-separated: new,good,acceptable,poor |
| listing_type | string | sale or exchange |
| min_price | number | Minimum price filter |
| max_price | number | Maximum price filter |
| city | string | City filter (partial match) |
| sort | string | newest, price_asc, price_desc, most_relevant |
| page | number | Page number (default: 1) |
| per_page | number | Items per page (default: 24) |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "condition": "good",
      "listing_type": "sale",
      "status": "available",
      "price": 45.00,
      "cover_image": "https://...",
      "city": "Riyadh",
      "created_at": "2026-06-01T10:00:00Z",
      "owner": { "id": "uuid", "full_name": "Ahmed" }
    }
  ],
  "total": 142,
  "page": 1,
  "per_page": 24,
  "has_more": true
}
```

#### `POST /api/books`
Create a new listing. **Auth required.**

**Request Body:**
```json
{
  "title": "The Pragmatic Programmer",
  "author": "David Thomas",
  "category_id": "uuid",
  "condition": "good",
  "listing_type": "sale",
  "price": 60,
  "description": "Great condition, minor highlights",
  "images": ["https://..."],
  "cover_image": "https://...",
  "city": "Jeddah",
  "language": "en"
}
```

**Response 201:** Full listing object.

#### `PATCH /api/books/:id`
Update own listing. **Auth required (owner only).**

#### `DELETE /api/books/:id`
Delete own listing. **Auth required (owner only).**

---

### 7.2 Requests API

#### `POST /api/requests`
Send a contact/exchange request. **Auth required.**

```json
{
  "listing_id": "uuid",
  "offer_listing_id": "uuid|null",
  "message": "I'd love to exchange this for my copy of..."
}
```

#### `PATCH /api/requests/:id`
Accept or reject a request. **Auth required (listing owner only).**

```json
{ "status": "accepted" | "rejected" }
```

---

### 7.3 AI API

#### `POST /api/ai/summarize`
Generate AI book summary using Claude.

```json
{ "listing_id": "uuid" }
```

**Response:**
```json
{
  "summary": "A definitive guide to writing clean, maintainable code...",
  "key_themes": ["Clean Code", "Refactoring", "SOLID Principles"],
  "target_audience": "Software developers seeking to improve code quality",
  "mood": "Technical, practical, motivational",
  "similar_books": ["Refactoring by Martin Fowler", "The Clean Coder"],
  "reading_time_estimate": "8-10 hours"
}
```

#### `POST /api/ai/tts`
Generate TTS audio preview.

```json
{ "listing_id": "uuid" }
```

**Response:**
```json
{ "audio_url": "https://...supabase.co/storage/v1/object/public/book-audio/listing_id.mp3" }
```

#### `POST /api/ai/recommend`
Get similar book recommendations.

```json
{ "listing_id": "uuid" }
```

#### `GET /api/ai/isbn?isbn=9780132350884`
Lookup book metadata by ISBN.

**Response:**
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "publisher": "Prentice Hall",
  "published_year": 2008,
  "cover_image": "https://books.google.com/...",
  "description": "...",
  "language": "en"
}
```

#### `POST /api/ai/chat`
Chat with Claude about a specific book.

```json
{
  "listing_id": "uuid",
  "message": "Is this book suitable for beginners?"
}
```

---

### 7.4 Categories API

#### `GET /api/categories`
List all categories (public).

#### `POST /api/categories`
Create category. **Admin only.**

---

### 7.5 Upload API

#### `POST /api/upload/image`
Upload a book image (multipart/form-data). **Auth required.**
- Field: `file` (File, image/*)
- Max size: 5MB
- Returns: `{ "url": "https://..." }`

---

## 8. Sprint Plan

### Sprint 1 (Week 1-2): Foundation
- [ ] Supabase project setup (schema + migrations 001-004)
- [ ] Next.js app scaffold + Tailwind + shadcn/ui
- [ ] Auth (register, login, profile auto-create)
- [ ] Categories CRUD + seed data
- [ ] Basic listing CRUD (no images yet)

### Sprint 2 (Week 3-4): Core Features
- [ ] Image upload to Supabase Storage
- [ ] Browse page with search + filters
- [ ] Book detail page
- [ ] Contact request / exchange proposal flow
- [ ] Accept/reject request with auto-reject + transaction

### Sprint 3 (Week 5): AI Features
- [ ] AI Reading Assistant (Claude summarization + chat)
- [ ] TTS Audio Preview (OpenAI TTS)
- [ ] Book Recommender (pgvector get_similar_books)
- [ ] ISBN Autofill (Google Books API)
- [ ] Background embedding generation (FastAPI)

### Sprint 4 (Week 6): Polish & Admin
- [ ] Dashboard: listings, requests, wishlist, history
- [ ] Admin: analytics charts, moderation, categories
- [ ] Arabic RTL full support
- [ ] Notifications system
- [ ] Performance optimization (image lazy-load, WebP)

### Sprint 5 (Week 7): Deployment & Testing
- [ ] Vercel deployment + env variables
- [ ] Railway AI service deployment + Docker
- [ ] Supabase Storage bucket policies
- [ ] End-to-end testing (register → list → request → accept)
- [ ] Mobile responsiveness testing

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Claude API rate limit hit | Medium | High | Cache ai_summary in DB |
| OpenAI TTS cost overrun | Low | Medium | Cache audio_url; limit to 1 per listing |
| pgvector embedding quality | Medium | Medium | Fallback to full-text search |
| Supabase cold start latency | Low | Low | Connection pooling enabled |
| Arabic font rendering | Low | Medium | Preload Noto Sans Arabic |
| ISBN not found | Medium | Low | Graceful empty state; manual entry |

---

*End of SRS*
