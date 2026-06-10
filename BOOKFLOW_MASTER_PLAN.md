# BookFlow — Master Project Plan (A → Z)
### AI-Enhanced Peer-to-Peer Book Exchange Platform
**Document type:** Comprehensive expert delivery plan · **Version:** 1.0 · **Last updated:** 2026-06-09
**Hackathon:** GenAI "Idea to Prototype" Challenge · **Region:** MENA (Arabic RTL + English LTR)

> This is the single source of truth for the whole project lifecycle: business case, product
> strategy, requirements, architecture, AI engineering, frontend, backend, database, deployment,
> QA, security, documentation, and the sprint roadmap. Every section is self-contained so any
> contributor — engineer, PM, designer, or stakeholder — can read just the part they own.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Case & Market Opportunity](#2-business-case--market-opportunity)
3. [Product Strategy (PM Layer)](#3-product-strategy-pm-layer)
4. [Requirements Specification](#4-requirements-specification)
5. [User Stories & Personas](#5-user-stories--personas)
6. [System Architecture](#6-system-architecture)
7. [Database Design (ERD + Migrations)](#7-database-design-erd--migrations)
8. [Backend Design (API + RLS + Functions)](#8-backend-design-api--rls--functions)
9. [AI Engineering Layer](#9-ai-engineering-layer)
10. [Frontend Design & Component System](#10-frontend-design--component-system)
11. [Internationalization (Arabic RTL + English)](#11-internationalization-arabic-rtl--english)
12. [Security, Privacy & Compliance](#12-security-privacy--compliance)
13. [Testing & Quality Strategy](#13-testing--quality-strategy)
14. [Deployment & DevOps](#14-deployment--devops)
15. [Observability, Cost & SRE](#15-observability-cost--sre)
16. [Sprint Plan & Roadmap](#16-sprint-plan--roadmap)
17. [Analytics, KPIs & North Star](#17-analytics-kpis--north-star)
18. [Risk Register & Mitigation](#18-risk-register--mitigation)
19. [Documentation Deliverables](#19-documentation-deliverables)
20. [Definition of Done & Launch Checklist](#20-definition-of-done--launch-checklist)
21. [Appendix: Environment, Tooling & Repo Layout](#21-appendix-environment-tooling--repo-layout)

---

## 1. Executive Summary

**One-liner.** BookFlow is a chat-free, payment-free peer-to-peer marketplace where readers in the
MENA region list, discover, sell, and swap used books, with an AI layer that makes discovery
intelligent (semantic search, recommendations, reading assistant, audio previews, ISBN autofill).

**Problem.** Used books pile up unused at home while students re-buy expensive textbooks. No simple,
bilingual (AR/EN), trust-based platform exists in the region that lets people exchange books without
payment rails or real-time chat overhead.

**Solution.** A two-minute listing flow + a 30-second discovery-to-request flow. A request → accept →
meetup state machine replaces chat. AI removes the cold-start and discovery friction that kills most
marketplaces.

**Why now.** Mature, low-cost building blocks (Next.js + Supabase + Vercel free tiers), affordable LLM
APIs (Claude, embeddings), and rising MENA student price sensitivity make a near-zero-infra launch
viable for a hackathon team.

| Dimension | Snapshot |
|---|---|
| Stage | Prototype / MVP (hackathon) |
| Primary users | University students (18–26) |
| Core differentiator | AI discovery + bilingual RTL + zero payment/chat friction |
| Stack | Next.js 14 · Supabase (Postgres + pgvector) · FastAPI AI service · Vercel + Railway |
| Success target (90 days) | 500 listings · 200 completed deals · 40% MAU return · <3s mobile load |

**The 5 AI bets, in priority order:** (1) Semantic search + recommender, (2) AI reading assistant,
(3) AI chat agent (natural-language search), (4) ISBN autofill scanner, (5) TTS audio teaser.

---

## 2. Business Case & Market Opportunity

> Framework: investor-ready business-case structure (problem → market → solution → moat →
> economics → GTM → risk → ask). Numbers below are **illustrative planning estimates** for a
> hackathon plan, not audited figures — every assumption is labeled and must be validated with
> primary research before any external use.

### 2.1 Problem (quantified)
- A typical MENA university student spends a meaningful share of term budget on textbooks, most of
  which lose ~all resale value through informal channels.
- Existing options are fragmented: generic classifieds (no book-specific UX), global stores
  (English-only, shipping cost), and informal Facebook/WhatsApp groups (no trust, no search).
- Cost of the problem: wasted spend on re-purchase + dead inventory (unused books at home) + time
  lost searching unstructured group chats.

### 2.2 Market sizing (TAM / SAM / SOM — methodology shown)
Use a **bottom-up** model so the assumptions are auditable:

```
TAM  = (MENA tertiary-education students) × (avg annual book spend)
SAM  = TAM filtered to: smartphone + Arabic/English + target launch countries (e.g. EG, SA, AE, JO)
SOM  = SAM × realistic 3-year capture rate (single-digit % of an early-stage P2P marketplace)
```

| Layer | Definition | How to validate |
|---|---|---|
| TAM | All used-book trade value across MENA student + general readers | National stats offices, UNESCO enrollment data |
| SAM | Reachable bilingual, smartphone-using segment in launch markets | Telecom penetration, app-store reach |
| SOM | Capturable in 3 years given marketing + network effects | Comparable marketplace cohort curves |

> **Action item (pre-pitch):** replace the formula placeholders with sourced figures from
> Perplexity / national statistics before presenting to judges or investors. Never present
> unsourced market numbers as fact.

### 2.3 Competitive landscape

| Factor | BookFlow | Generic classifieds | Global used-book stores | FB/WhatsApp groups |
|---|---|---|---|---|
| Book-specific UX | ✓ | ✗ | ✓ | ✗ |
| Arabic RTL native | ✓ | partial | ✗ | partial |
| Exchange (swap) flow | ✓ | ✗ | ✗ | manual |
| AI discovery | ✓ | ✗ | partial | ✗ |
| No payment friction | ✓ | ✓ | ✗ (checkout) | ✓ |
| Trust/moderation | ✓ | weak | ✓ | none |

**Differentiators (the moat):** (1) bilingual RTL-first product, (2) swap-native request engine,
(3) AI discovery layer reducing cold-start, (4) data network effect — more listings improve
recommendations which attract more users.

### 2.4 Business model (post-MVP options — MVP is free)
- **MVP:** 100% free to maximize liquidity and listings (network effects first).
- **Future monetization candidates** (validate, don't assume): featured/boosted listings, optional
  paid delivery integration, campus/club partnerships, light ads in non-intrusive slots, premium
  seller analytics. Keep the core exchange free forever.

### 2.5 Unit-economics framework (for when monetization is introduced)
Track these formulas from day one even if revenue = 0:
- **CAC** = total acquisition spend ÷ new activated users
- **LTV** = avg contribution per active user × expected active lifetime
- **LTV:CAC** target ≥ 3
- **Activation rate** = users who complete ≥1 listing or request ÷ signups
- **Liquidity** = % of listings that receive ≥1 request within 14 days (the health metric for any
  marketplace)

### 2.6 Funding/resourcing ask (hackathon framing)
For a hackathon, the "ask" is judging credit + a path to a pilot. If extended to a real raise, the
use-of-proceeds split would skew to (a) growth/community in launch campuses and (b) AI cost +
trust/safety, since infra is near-free at this scale.

---

## 3. Product Strategy (PM Layer)

### 3.1 Vision statement
> Build the simplest, safest marketplace for used books in the Arab world — where any reader can
> list, discover, and swap books with zero friction and no payment infrastructure.

### 3.2 North Star Metric
**Completed book exchanges/sales per week.** It captures real value delivered (a book changed
hands), aligns supply (listings) and demand (requests), and is hard to game.

Supporting input metrics (the "North Star inputs"):
- New listings/week (supply)
- Search→detail→request conversion (demand intent)
- Request→accept rate (matching quality)
- 30-day return rate (retention)

### 3.3 Prioritization (RICE on the AI backlog)
Score = (Reach × Impact × Confidence) ÷ Effort. Relative scoring for sequencing only:

| Feature | Reach | Impact | Confidence | Effort | RICE (rel.) | Verdict |
|---|---|---|---|---|---|---|
| Semantic search + recommender | High | High | Med-High | Med | **Highest** | MVP core |
| Reading assistant (summary/Q&A) | High | Med | High | Low-Med | **High** | MVP |
| AI chat agent (NL search) | Med | High | Med | Med-High | **High** | MVP/post |
| ISBN autofill scanner | Med | Med | Med | Med | **Med** | Could |
| TTS audio teaser | Low-Med | Low-Med | Med | Med | **Lower** | Nice-to-have |

### 3.4 MoSCoW scope control
- **Must:** auth, listing CRUD, search/filter, request→accept/reject state machine, RLS, AR/EN, photo upload.
- **Should:** wishlist, transaction history, notifications, admin analytics, recommender.
- **Could:** ISBN scanner, TTS, AI chat agent.
- **Won't (MVP):** real-time chat, payments, delivery logistics, native mobile apps.

### 3.5 Out of scope for MVP (explicit)
Payment processing, in-app chat, shipping/logistics, native apps. These are deliberate cuts to
protect the 6-sprint timeline; they live in the post-MVP backlog.

---

## 4. Requirements Specification

### 4.1 Functional requirements (MoSCoW + acceptance criteria)

| # | Requirement | Role | Priority | Acceptance criteria |
|---|---|---|---|---|
| FR-01 | Register (email or phone OTP) | User | Must | Account created, verified, session issued |
| FR-02 | Browse listings without login | Guest | Must | All available listings visible, no auth |
| FR-03 | Book listing CRUD | User | Must | Title, author, category, condition, photos, type persisted |
| FR-04 | Search & filter | All | Must | Full-text + filter by condition/type/price/city/language |
| FR-05 | Send contact request + message | User | Must | Request stored, owner notified |
| FR-06 | Propose exchange (own book as offer) | User | Must | Swap offer linked to requester's listing |
| FR-07 | Accept / reject requests | User | Must | Status updates, requester notified, side effects fire |
| FR-08 | Mark sold/exchanged/unavailable | User | Must | Status reflected immediately, filtered from search |
| FR-09 | Transaction history | User | Should | Completed deals: date, party, type |
| FR-10 | Wishlist | User | Should | Save listing; notify on re-availability |
| FR-11 | Admin: manage categories | Admin | Must | CRUD; changes reflect in listings |
| FR-12 | Admin: moderate listings/users | Admin | Must | Suspend/remove; reason logged |
| FR-13 | Admin: analytics dashboard | Admin | Should | Listings, active users, exchange volume |
| FR-14 | In-app notifications | User | Should | Request events update notification bell |
| FR-15 | Arabic & English UI | All | Must | Full RTL, locale switcher, complete translations |
| FR-16 | Photo upload (≤5/listing) | User | Must | Compressed, CDN-stored, preview shown |
| FR-17 | AI semantic search | All | Must | Vector similarity + full-text fallback |
| FR-18 | AI reading assistant | All | Should | Summary, themes, audience, Q&A per book |
| FR-19 | AI recommender | All | Should | ≥6 related books on detail page |
| FR-20 | AI chat agent (NL search) | User | Could | NL query → structured filtered results |
| FR-21 | ISBN autofill scanner | User | Could | Camera/manual ISBN → prefill metadata |
| FR-22 | TTS audio teaser | All | Could | Description → cached MP3 playback |

### 4.2 Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | Page load <3s on 4G; search <500ms; images lazy-loaded + WebP |
| Security | RLS on all tables; HTTPS-only; OTP verification; rate-limited requests |
| Responsive | Mobile-browser first; touch-friendly; no native app for MVP |
| i18n | Full AR (RTL) + EN (LTR); locale persisted in profile |
| Availability | 99.5% via managed infra; zero-downtime deploys |
| Accessibility | WCAG 2.1 AA: semantic HTML, ARIA, keyboard nav |
| AI cost | Per-request caps; cache AI summaries/embeddings/audio; graceful fallback when AI unavailable |
| Privacy | Contact info revealed only after request acceptance; PII never in URLs/logs |

---

## 5. User Stories & Personas

### 5.1 Personas
- **Layla, 20 — Engineering student (primary).** Wants cheap textbooks each semester; price-sensitive;
  mobile-only; switches between Arabic and English.
- **Omar, 24 — General reader (secondary).** Trades fiction; cares about discovery and condition.
- **Huda, 30 — Collector (tertiary).** Sells rarer editions; wants accurate listings and trust.
- **Admin/Moderator.** Keeps the catalog clean and the platform safe.

### 5.2 Key stories (Given/When/Then-ready, grouped by epic)

**Epic: Auth**
- *As a new visitor* I want to register with email or phone so I can list and request.
  AC: email OR phone+country code; OTP <30s; duplicate detection; redirect to Complete Profile.
- *As a registered user* I want to log in so I can reach my dashboard.
  AC: email+password or phone+OTP; session refreshes; specific error on failure.

**Epic: Listings**
- *As a user* I want to add a listing with photos, condition, and type so others can find it.
  AC: required fields enforced; ≤5 photos each <500KB; sale(price) OR exchange; appears in search <10s; draft autosave.
- *As an owner* I want to mark sold/exchanged/unavailable so status stays accurate.
  AC: status dropdown on My Listings; sold items filtered from default search; wishlisters notified.

**Epic: Discovery**
- *As a guest* I want to search/filter without an account so I can explore first.
  AC: search on home + listing pages; multi-select condition, type, price slider; client-side update; sort newest/price; "Contact Seller" prompts registration.

**Epic: Exchange & Requests**
- *As a user* I want to propose a swap by offering one of my books so the seller can evaluate.
  AC: swap UI only on exchange listings; pick from own available books; optional message ≤500 chars; prompt to list if none; block duplicate requests.
- *As an owner* I want to accept/reject requests to manage exchanges.
  AC: requests show pending/accepted/rejected + timestamps; accept auto-rejects other pending; requester notified; accepted reveals contact info.

**Epic: Admin**
- *As an admin* I want analytics to understand usage.
  AC: totals (listings, active users 30d, exchanges); category bar chart; top-10 requested books; CSV export.

---

## 6. System Architecture

### 6.1 High-level diagram
```
                         ┌─────────────────────────┐
                         │       User Browser       │
                         │   (mobile-first, AR/EN)  │
                         └────────────┬─────────────┘
                                      │ HTTPS
                         ┌────────────▼─────────────┐
                         │   Next.js 14 (Vercel)     │
                         │  • App Router pages       │
                         │  • API Route Handlers     │
                         │  • Supabase JS client     │
                         │  • next-intl (RTL/LTR)    │
                         └───────┬───────────┬───────┘
                                 │           │
            Supabase JS / RPC    │           │  REST (server-to-server)
                                 ▼           ▼
        ┌────────────────────────────┐   ┌──────────────────────────────┐
        │  Supabase (managed cloud)  │   │  FastAPI AI Service (Railway)  │
        │  • PostgreSQL 16 + pgvector│   │  • /summarize → Claude         │
        │  • Auth (email + phone OTP)│   │  • /embeddings → MiniLM        │
        │  • Storage (images, audio) │◄──┤  • /recommend → pgvector       │
        │  • Realtime (notifications)│   │  • /isbn → Google Books/OpenLib│
        │  • RLS + RPC functions     │   │  • /tts → OpenAI TTS → Storage │
        └────────────────────────────┘   └──────────────────────────────┘
```

### 6.2 Design principles
1. **Thin server, smart database.** Heavy logic (accept-request side effects, search ranking,
   vector similarity) lives in Postgres RPC functions so it's atomic and reusable.
2. **AI is an isolated microservice.** The FastAPI service is replaceable/independently scalable and
   keeps Python ML deps out of the Next.js bundle.
3. **Fail open on AI.** If an AI call errors or times out, the core marketplace still works (search
   falls back to full-text; detail page renders without the assistant).
4. **Cache everything expensive.** Embeddings, AI summaries, and TTS audio are generated once and
   cached in the DB/Storage; never regenerated on every page view.
5. **Security at the data layer.** RLS is the last line of defense regardless of what the API does.

### 6.3 Request lifecycle (example: accept an exchange)
```
User taps "Accept" → Next.js API route validates session
  → calls Supabase RPC accept_request(request_id)
     (single transaction):
       1. request.status = accepted
       2. all other pending requests for that listing → rejected
       3. listing.status = sold | exchanged
       4. insert transaction row
       5. insert notifications (requester + losers)
  → Realtime pushes notification to clients
  → API returns requester contact info to the owner
```

### 6.4 Why this stack
| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 14 App Router + TS | SSR/ISR, file routing, RTL support, Vercel-native |
| Styling | Tailwind + shadcn/ui | Utility-first, RTL via `dir`, copy-paste components |
| DB/Auth/Storage | Supabase | Postgres + pgvector + Auth + Storage + Realtime in one free tier |
| AI service | FastAPI (Python) | Native ML ecosystem (sentence-transformers), async, cheap on Railway |
| LLM | Claude (summaries/Q&A/agent) | Strong bilingual reasoning + tool use |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 | 384-dim, free, runs locally in the AI service |
| TTS | OpenAI TTS | Simple API, AR-capable voices |
| Deploy | Vercel + Railway | Zero-config CI/CD, free tiers cover MVP |

---

## 7. Database Design (ERD + Migrations)

### 7.1 Core entities

| Table | Purpose | Key columns |
|---|---|---|
| `user_profiles` | Extends `auth.users` | id (PK→auth.users), display_name, email, phone, city, bio, avatar_url, role(enum), locale, is_suspended, created_at |
| `categories` | Bilingual book categories | id (PK), name_en, name_ar, slug(unique), icon, is_active |
| `book_listings` | The core listing | id (PK), owner_id (FK), category_id (FK), title, author, isbn, description, condition(enum), listing_type(enum), price numeric(10,2), status(enum), city, language, embedding vector(384), ai_summary jsonb, audio_url, search_vector tsvector, created_at |
| `book_photos` | Listing images | id (PK), book_id (FK), url, position |
| `book_requests` | Contact/exchange requests | id (PK), book_id (FK), requester_id (FK), offered_book_id (FK, nullable), message, status(enum), created_at, responded_at |
| `transactions` | Completed deals | id (PK), request_id (FK), book_id (FK), seller_id (FK), buyer_id (FK), type(enum), completed_at |
| `wishlist` | Saved listings | id (PK), user_id (FK), book_id (FK), created_at — unique(user_id, book_id) |
| `notifications` | In-app events | id (PK), user_id (FK), type(enum), title, body, is_read, ref_id, created_at |
| `reports` | User-flagged listings (moderation) | id (PK), reporter_id (FK), book_id (FK), reason, status, created_at |

**Enums**
- `role`: guest \| user \| admin
- `condition`: new \| good \| acceptable \| poor
- `listing_type`: sale \| exchange
- `status` (listing): available \| sold \| exchanged \| unavailable
- `request_status`: pending \| accepted \| rejected
- `transaction_type`: sale \| exchange
- `notification_type`: request_received \| request_accepted \| request_rejected \| wishlist_available

### 7.2 Relationships (cardinality)
```
user_profiles 1───∞ book_listings        (owner)
categories    1───∞ book_listings
book_listings 1───∞ book_photos
book_listings 1───∞ book_requests         (target)
book_listings 0───∞ book_requests         (offered_book, optional swap)
book_requests 1───1 transactions          (on accept)
user_profiles 1───∞ wishlist  ∞───1 book_listings
user_profiles 1───∞ notifications
```

### 7.3 Migration files (order matters)
| File | Contents |
|---|---|
| `001_initial_schema.sql` | All core tables, enums, indexes, triggers, 12 seeded bilingual categories |
| `002_enable_pgvector.sql` | `CREATE EXTENSION vector;` + `embedding vector(384)` column on book_listings + IVFFlat/HNSW index |
| `003_rls_policies.sql` | Row Level Security policies for every table |
| `004_functions.sql` | RPC functions + the `handle_new_user` trigger |

### 7.4 Key SQL — full-text search
```sql
-- Generated, auto-maintained search vector
ALTER TABLE book_listings ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(title,'') || ' ' || coalesce(author,'') || ' ' || coalesce(description,''))
  ) STORED;

CREATE INDEX books_search_idx ON book_listings USING gin(search_vector);

-- Search query (full-text, ranked)
SELECT * FROM book_listings
WHERE search_vector @@ plainto_tsquery('simple', :query)
  AND status = 'available'
ORDER BY ts_rank(search_vector, plainto_tsquery('simple', :query)) DESC;
```

### 7.5 Key SQL — pgvector semantic search
```sql
-- After 002 enables the extension and adds embedding vector(384)
CREATE INDEX books_embedding_idx ON book_listings
  USING hnsw (embedding vector_cosine_ops);

-- Similarity search (query already embedded by AI service)
SELECT id, title, author, 1 - (embedding <=> :query_embedding) AS similarity
FROM book_listings
WHERE status = 'available' AND embedding IS NOT NULL
ORDER BY embedding <=> :query_embedding
LIMIT :k;
```

---

## 8. Backend Design (API + RLS + Functions)

### 8.1 RPC functions (logic lives in the DB for atomicity)

| Function | Responsibility |
|---|---|
| `accept_request(request_id)` | Atomic: accept → reject siblings → mark listing sold/exchanged → create transaction → fire notifications |
| `search_listings(query, filters)` | Full-text + filter (category, condition, price, city, language, listing_type), sortable, paginated |
| `get_similar_books(listing_id, k)` | pgvector cosine similarity (content-based recs) |
| `get_collaborative_recommendations(user_id)` | Recs from wishlist + transaction overlap (collaborative filtering) |
| `search_books_semantic(query_embedding, k)` | Vector similarity for NL/semantic search |
| `handle_new_user()` | Trigger: auto-create `user_profiles` row on signup |

### 8.2 REST API surface (Next.js Route Handlers)

Base: `https://<app>/api` · Auth: `Bearer {supabase_jwt}` · Errors: RFC-7807-style JSON.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/books` | public / user | List+search / create listing |
| GET/PUT/DELETE | `/api/books/[id]` | public / owner | Detail / update / delete |
| GET | `/api/books/my` | user | Current user's listings |
| POST | `/api/books/[id]/requests` | user | Send contact/exchange request |
| PUT | `/api/requests/[id]` | owner | Accept or reject |
| GET/POST | `/api/wishlist` | user | List / add |
| DELETE | `/api/wishlist/[id]` | user | Remove |
| GET | `/api/transactions` | user | History (role: seller/buyer) |
| GET | `/api/categories` | public | All categories |
| POST | `/api/upload/image` | user | Upload to Supabase Storage |
| GET | `/api/admin/analytics` | admin | Platform stats |
| POST | `/api/ai/agent` | user | NL chat agent (Claude tool use) |
| POST | `/api/ai/summarize` | user | Generate/fetch book summary |
| POST | `/api/ai/chat` | user | Reading-assistant Q&A |
| POST | `/api/ai/recommend` | public | Similar/recommended books |
| GET | `/api/ai/isbn` | user | ISBN → metadata |
| POST | `/api/ai/tts` | user | Generate audio preview |

**Example — `PUT /api/requests/:id` (accept):**
```jsonc
// request
{ "action": "accept" }   // or "reject"
// on accept the route calls accept_request() RPC, then returns:
{ "status": "accepted", "requester_contact": { "display_name": "...", "phone_or_email": "..." } }
```

### 8.3 Row Level Security (the safety net)
Representative policies (every table gets explicit policies; deny-by-default):
- `book_listings`: `SELECT` allowed for everyone when `status='available'` OR `owner_id = auth.uid()`;
  `INSERT/UPDATE/DELETE` only when `owner_id = auth.uid()` (admins bypass via role claim).
- `book_requests`: visible to requester or the listing owner only; insert only as self; update
  (accept/reject) only by the listing owner.
- `wishlist` / `notifications` / `transactions`: scoped to `user_id = auth.uid()` (transactions also
  visible to the counterpart party).
- `reports`: insert by any authed user; read/manage only by admins.
- Contact info (phone/email) is **never** selectable on a listing until a request is `accepted`.

### 8.4 Validation & abuse controls
- Server-side schema validation (zod) on every write route — never trust client payloads.
- Rate-limit contact requests per user per hour; block duplicate request to the same listing.
- Image upload: validate MIME + size (<500KB after compression), max 5 per listing.

---

## 9. AI Engineering Layer

> Framework: production-LLM patterns — model selection, retrieval pipeline, caching, cost control,
> safety/guardrails, observability, and graceful degradation. **Every AI feature must work, fail
> safely, and stay cheap.**

### 9.1 Feature → model → fallback matrix

| Feature | Model / method | Trigger | Cache | Fallback if AI down |
|---|---|---|---|---|
| Semantic search | MiniLM embeddings + pgvector cosine | Search box (semantic mode) | Listing embeddings cached in DB | Postgres full-text search |
| Recommender (content) | `get_similar_books` over embeddings | Detail page sidebar | Embeddings cached | "Newest in category" |
| Recommender (collab) | wishlist/transaction overlap SQL | Dashboard "For You" | n/a (cheap query) | Content-based recs |
| Reading assistant | Claude (summary/themes/audience/Q&A) | Detail page panel | `ai_summary` JSONB cached forever | Hide panel, show raw description |
| AI chat agent | Claude + `search_books` tool use | `/chat` page | n/a (live) | Redirect to normal filtered search |
| ISBN autofill | Google Books → OpenLibrary | List-a-book form | Per-ISBN metadata cache | Manual entry |
| TTS teaser | OpenAI TTS → Storage MP3 | Detail page play button | `audio_url` cached | Hide audio player |

### 9.2 RAG / retrieval pipeline (search + recommendations)
```
Ingest (on create/update listing):
  title + author + description + category
     → AI service /embeddings (MiniLM, 384-dim)
     → store vector in book_listings.embedding (upsert)

Query (semantic search):
  user query → embed (same model) → search_books_semantic(query_embedding, k)
     → hybrid: combine vector hits with full-text hits, dedupe, rank
     → optional rerank for top results
```
**Chunking note:** listings are short, so the whole text is one embedding (no chunking needed).
For longer content later, switch to recursive/semantic chunking.

### 9.3 AI chat agent (tool-use loop)
- Claude is given a single `search_books` tool whose schema mirrors `search_listings` filters
  (price range, condition, listing_type, city, language, sort).
- Agentic loop capped at **5 iterations** to bound cost/latency.
- Output: conversational text + inline structured book cards + suggested follow-up chips.
- The model never invents listings — it can only surface rows returned by the tool.

### 9.4 Prompt engineering standards
- System prompts are versioned and stored in code (not inline magic strings); A/B test variants.
- Bilingual: detect query language; respond in the user's locale; keep book titles verbatim.
- Structured outputs: when the UI needs JSON (e.g., summary tabs), instruct "JSON only, no prose,
  no markdown fences," then parse defensively and validate against a schema.
- Few-shot examples for the summary format so themes/audience/mood come back consistently.

### 9.5 Guardrails & safety
- **Prompt-injection defense:** treat listing text/descriptions as untrusted data, not instructions;
  the agent's tool inputs are constrained to the filter schema.
- **PII:** never send user contact info to any model; embeddings/summaries use only book metadata.
- **Content moderation:** flag/suppress inappropriate listings before they reach AI features; reports
  table feeds admin moderation.
- **Cost guardrails:** per-request token caps, per-user daily AI quotas, semantic + response caching,
  cheapest-capable model per task.
- **Observability:** log latency, token usage, cache-hit rate, and error rate per AI endpoint; alert
  on cost or error spikes.

### 9.6 AI service structure (FastAPI on Railway)
```
ai-service/
├── main.py                     # app entry, CORS, router registration, health check
├── routers/
│   ├── summarization.py        # Claude summary + Q&A
│   ├── recommendations.py      # pgvector similarity queries
│   ├── isbn.py                 # Google Books + OpenLibrary lookup
│   └── tts.py                  # OpenAI TTS → Storage upload
├── services/
│   ├── embeddings.py           # sentence-transformers MiniLM
│   ├── isbn_service.py         # fetch + normalize metadata
│   └── tts_service.py          # generate + store audio
├── models/schemas.py           # Pydantic request/response models
├── Dockerfile
├── railway.toml
└── requirements.txt
```
**Production posture:** async endpoints, request timeouts, retries with backoff + circuit breaker on
upstream APIs, structured JSON logging, `/health` for Railway probes.

---

## 10. Frontend Design & Component System

### 10.1 Design language
- **Theme:** "BookFlow Narrative" — dark navy base, glassmorphism cards, accent trio.
- **Tokens:** Background `#0F172A` · Violet (AI) `#8B5CF6` · Emerald (active) `#10B981` ·
  Rose (error) `#F43F5E`. Tokens live in `frontend/src/lib/design-tokens.json` (Figma Tokens format).
- **Type & spacing:** consistent scale; generous touch targets (≥44px) for mobile-first.
- Intentional, non-templated visuals: distinctive condition badges, listing-type chips, and an AI
  panel that reads as a first-class feature, not a bolt-on.

### 10.2 Pages

**Public**
| Route | Page |
|---|---|
| `/` | Landing — hero, AI feature overview, trending books, how-it-works |
| `/books` | Browse — sidebar filters + responsive grid |
| `/books/[id]` | Detail — listing + Reading Assistant + Audio + Recommender |
| `/chat` | AI agent — conversational search with result cards |
| `/list-book` | Create listing — multi-step form + ISBN scanner |
| `/auth/login`, `/auth/register` | Auth |

**Dashboard (authed)**
| Route | Page |
|---|---|
| `/dashboard` | Overview — active listings, exchanges, wishlist, pending requests |
| `/dashboard/listings` | My listings — CRUD + status toggle |
| `/dashboard/wishlist` | Saved books |
| `/dashboard/requests` | Incoming (accept/reject) + outgoing |
| `/dashboard/history` | Transaction log |
| `/dashboard/profile` | Edit profile |

**Admin (admin role)**
| Route | Page |
|---|---|
| `/admin` | Stats + growth charts |
| `/admin/users` | User management (role, suspend) |
| `/admin/listings` | Listings moderation |
| `/admin/categories` | Category CRUD (bilingual) |

### 10.3 Component inventory
| Component | Role |
|---|---|
| `Header` | Nav + auth state + locale switcher + mobile menu |
| `BookCard` / `BookGrid` | Grid card (condition badge, price/exchange chip, wishlist toggle) |
| `BookFilters` | Category, condition, price range, city, language |
| `SearchBar` | Debounced query, semantic/full-text toggle |
| `ReadingAssistant` | Tabs (summary, themes, audience, mood, similar) + Q&A chat |
| `AudioPlayer` | TTS playback with waveform |
| `ISBNScanner` | Camera barcode + manual fallback |
| `Recommender` | Similar + collaborative suggestions |
| `RequestCard` / `RequestModal` | Request item + exchange proposal modal |
| `AdminCharts` | Growth + category breakdown |
| `NotificationBell` | Realtime in-app notifications |

### 10.4 TypeScript types (single source in `src/types/index.ts`)
`BookListing`, `BookRequest`, `UserProfile`, `Category`, `Transaction`, `Notification`,
`AIBookSummary`, `BookRecommendation`, `SearchFilters`, `AdminStats`; enums `BookCondition`,
`ListingType`, `ListingStatus`, `RequestStatus`, `UserRole`, `Locale`.

### 10.5 State & data fetching
- Server Components for initial reads (SEO + speed); client components for interactivity.
- Supabase client (browser) for authed reads; server client for privileged routes.
- Optimistic UI for wishlist toggle and request actions; revalidate on confirm.
- Realtime subscription for notifications.

---

## 11. Internationalization (Arabic RTL + English)

- **Library:** `next-intl` with App Router. Locales `en` (LTR) + `ar` (RTL).
- **Routing:** middleware detects locale, sets `<html lang dir>` (`dir="rtl"` for Arabic).
- **Messages:** `en.json` + `ar.json`; no hard-coded strings in components.
- **Data:** categories store `name_en` and `name_ar`; listing content stays in its original language.
- **RTL correctness:** logical CSS properties (`margin-inline-start`, etc.), mirrored icons where
  meaningful, RTL-aware carousels and number/date formatting.
- **QA gate:** every screen verified in both locales on a real device before "done."

---

## 12. Security, Privacy & Compliance

- **AuthZ:** Supabase Auth (email + phone OTP); role-based access; admin routes require admin JWT claim.
- **Data layer:** RLS deny-by-default on all tables; privileged ops only via service role on the server.
- **Transport:** HTTPS-only, HSTS; secrets only in platform env vars, never in the repo or client bundle.
- **Privacy by design:** seller contact revealed only after request acceptance; no PII in URLs, query
  strings, logs, or analytics events; embeddings/summaries exclude personal data.
- **Abuse prevention:** rate limiting on requests/uploads; duplicate-request blocking; report +
  moderation workflow; suspend/remove with logged reason.
- **File safety:** validate type and size; store in scoped Storage buckets with signed URLs.
- **Compliance posture:** align with regional data-protection expectations (GDPR/CCPA-style
  principles: data minimization, user deletion, consent for non-essential cookies — decline
  non-essential by default).

---

## 13. Testing & Quality Strategy

### 13.1 Test pyramid
| Layer | Tooling | Coverage focus |
|---|---|---|
| Unit | Vitest/Jest | utils, validators, formatters, RPC wrappers |
| Component | React Testing Library | BookCard, filters, request modal states |
| Integration | Supabase test project | RLS policies, RPC side effects (accept_request) |
| E2E | Playwright | register→list→search→request→accept→history; AR + EN |
| AI eval | scripted prompts + golden outputs | summary format stability, agent tool-call correctness, no-hallucination check |

### 13.2 Critical test scenarios
- Accept-request side effects fire exactly once and atomically (no double transactions).
- Sold/exchanged listings disappear from default search.
- Guest "Contact Seller" forces registration.
- RLS prevents reading others' requests, wishlist, contact info.
- Semantic search degrades to full-text when AI service is down.
- Arabic RTL layout has no clipped/overlapping elements on mobile.

### 13.3 Quality gates (CI must pass before merge)
Typecheck (tsc) · lint · unit+component tests · build · (nightly) E2E + AI eval.
A **vibe-code audit** pass on AI-generated code: check for missing error handling, unguarded async,
hard-coded secrets, and fragile selectors before it ships.

---

## 14. Deployment & DevOps

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Auto-deploy from git; env vars in dashboard; preview deploys per PR |
| AI service | Railway | `railway.toml` + `Dockerfile`; health-check probe |
| Database | Supabase cloud | Migrations via Supabase CLI; RLS reviewed before prod |
| Storage | Supabase Storage | Buckets: `book-images`, `tts-audio`; signed URLs |

### 14.1 CI/CD pipeline
```
push/PR → install → typecheck → lint → unit+component tests → build
        → Vercel preview deploy (frontend) + Railway preview (AI)
merge to main → production deploy (zero-downtime) → smoke test → tag release
```

### 14.2 Environments
- **Local:** Supabase local or a dev project; `.env.local`.
- **Preview:** per-PR ephemeral; safe seed data only.
- **Production:** locked env vars, rate limits on, monitoring on.

### 14.3 Environment variables
```
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never exposed to client
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AI_SERVICE_URL=

# AI service (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

## 15. Observability, Cost & SRE

- **Errors:** Sentry (free tier) on frontend + AI service; source maps; alert on new error types.
- **Web vitals:** Vercel Analytics — track LCP/CLS/INP against the <3s/4G budget.
- **AI cost dashboard:** per-endpoint token usage, cache-hit rate, $/day; alert on spikes.
- **DB health:** slow-query log, index usage, connection pool watch.
- **SLOs (targets):** 99.5% uptime · search p95 <500ms · AI summary p95 <4s (cached: <200ms).
- **Runbooks:** "AI service down" (fallbacks verified), "DB migration rollback," "abuse spike."

---

## 16. Sprint Plan & Roadmap

Six 2-week sprints → working MVP. Fibonacci points (1,2,3,5,8,13). Lanes: Frontend · Backend/DB ·
Infra · QA · **AI**.

### Sprint 1 — Foundation & Auth (Weeks 1–2) · ~32 pts
Supabase project + schema migration + RLS (8) · Vercel + repo + CI/CD (5) · Next.js 14 + Tailwind +
next-intl AR/EN scaffold (5) · Registration UI + OTP (5) · Login + session (3) · Base responsive
layout (3) · Auth tests (3).

### Sprint 2 — Listings CRUD (Weeks 3–4) · ~38 pts
Books table + categories seed + Storage bucket (5) · Create-listing form (8) · Multi-photo upload +
compress (5) · BookCard + grid (5) · Detail page (5) · Edit/delete + status (5) · CRUD/upload tests (5).

### Sprint 3 — Search, Filter & Discovery + Semantic AI (Weeks 5–6) · ~36 pts
Full-text tsvector + gin index (5) · **pgvector + embedding ingest pipeline (5, AI)** · Search bar
debounced (3) · Filter panel (8) · Sort + URL params (3) · Pagination/infinite scroll (5) · Category
browse (3) · **Semantic search wiring + full-text fallback (2, AI)** · Search tests (2).

### Sprint 4 — Exchange & Request Flow (Weeks 7–8) · ~40 pts
contact_requests table + state machine + RLS (5) · Send-request modal (5) · Exchange proposal UI (8) ·
Incoming requests accept/reject + side effects via RPC (8) · Outgoing requests (3) · transactions +
auto-create (3) · Realtime notifications (5) · Full-flow integration tests (3).

### Sprint 5 — Wishlist, History, Admin + AI Reading Assistant (Weeks 9–10) · ~38 pts
Wishlist save/unsave + page (5) · Wishlist re-availability notify (5) · Transaction history (3) ·
Admin RBAC middleware (5) · Admin category CRUD (3) · Admin listings moderation (5) · Admin user mgmt
(5) · **Reading Assistant (summary/themes/Q&A) + cache (5, AI)** · Admin/wishlist tests (2).

### Sprint 6 — Recommender, AI Agent, Analytics, Polish & Launch (Weeks 11–12) · ~40 pts
**Recommender (content + collaborative) on detail + dashboard (5, AI)** · **AI chat agent with
tool-use (5, AI)** · Admin analytics dashboard + charts (8) · CSV export (3) · Perf pass (lazy
images, ISR, Core Web Vitals) (5) · WCAG 2.1 AA audit (5) · Bug bash + Playwright E2E (5) · Prod
config + rate limiting + Sentry/analytics (4).

> **Optional / stretch (post-MVP backlog):** ISBN scanner, TTS audio teaser, advanced reranking,
> GraphRAG-style discovery, native app shell.

---

## 17. Analytics, KPIs & North Star

### 17.1 Metric hierarchy
```
North Star: Completed deals / week
 ├── Supply:   new listings/week, % listings with photo, time-to-list
 ├── Demand:   searches/user, search→detail CTR, detail→request CTR
 ├── Matching: request→accept rate, time-to-accept, duplicate-request rate
 ├── Retention: D1/D7/D30 return, wishlist→deal conversion
 └── Health:   liquidity (% listings with ≥1 request in 14d), search latency, AI cache-hit rate
```

### 17.2 90-day targets (from the vision doc)
500 listings · 200 completed deals · 40% monthly active return · <3s mobile load · full AR/EN.

### 17.3 Admin dashboard contents
Totals (listings, active users 30d, exchanges, sales) · listings-by-category bar chart · top-10
requested books · flagged/reported listings · CSV export. (See `AdminStats` type + `AdminCharts`.)

### 17.4 Experimentation
A/B framework for: search ranking (semantic vs hybrid weight), summary prompt variants, landing CTA.
Always define the metric and minimum detectable effect before shipping a test.

---

## 18. Risk Register & Mitigation

| # | Risk | Type | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | Cold start — too few listings to be useful | Market | High | High | Seed campuses, club partnerships, founder-listed inventory; recommender to surface what exists |
| R2 | AI cost runs away | Financial | Med | Med | Cache summaries/embeddings/audio; per-user quotas; cheapest-capable model; cost alerts |
| R3 | AI hallucination / unsafe output | Execution | Med | Med | Agent can only return tool results; schema validation; moderation; fail-open fallbacks |
| R4 | Prompt injection via listing text | Security | Med | Med | Treat listing content as data; constrained tool schema; no PII to models |
| R5 | RLS misconfiguration leaks data | Security | Med | High | Deny-by-default; integration tests for every policy; pre-prod review |
| R6 | Arabic RTL breakage | Execution | Med | Med | Logical CSS; dual-locale QA gate per screen on real devices |
| R7 | Trust/safety (bad actors, fake listings) | Market | Med | Med | Reports + moderation queue; suspend/remove; rate limits |
| R8 | Timeline slip in 6 sprints | Execution | Med | Med | MoSCoW discipline; AI "Could" items are cut-first; weekly burndown |
| R9 | Single-region infra outage | External | Low | Med | Managed multi-AZ providers; documented runbooks |
| R10 | Privacy/compliance gap | Regulatory | Low | High | Data minimization; deletion path; consent defaults; PII audit |

---

## 19. Documentation Deliverables

| Artifact | Location | Audience |
|---|---|---|
| This master plan | `BOOKFLOW_MASTER_PLAN.md` | Everyone |
| Vision document | hackathon brief + §1–3 here | Stakeholders/judges |
| Requirements spec (SRS) | `docs/SRS.md` | Eng + PM |
| Architecture doc | `docs/ARCHITECTURE.md` + Eraser diagram | Eng |
| API reference | route handlers + §8 (optionally Mintlify site) | Integrators |
| ERD | dbdiagram.io / Eraser + §7 | Eng |
| User stories | §5 (+ Jira import) | Eng + QA |
| Use case diagram | brief (SVG) | Stakeholders |
| Wireframes | brief + Stitch/Figma screens | Design + Eng |
| Sprint plan | §16 (+ Jira board) | Team |
| Business case | §2 | Investors/partners |
| README | `README.md` (setup, run, deploy) | New contributors |

**Hackathon "Idea to Prototype" required set — coverage check:** Vision ✓ · Requirements ✓ ·
User Stories ✓ · Use Case ✓ · ERD ✓ · API Docs ✓ · Wireframes ✓ · Sprint Plan ✓ · Working MVP ✓.

---

## 20. Definition of Done & Launch Checklist

### 20.1 "Done" for the MVP
- `npm run dev` starts with no errors.
- All main pages render (Landing, Browse, Detail, List, Auth ×2, Dashboard, Admin).
- Full lifecycle works: register → verify → list → search → request → accept → transaction → history.
- Semantic search returns results; falls back to full-text when AI is down.
- Reading Assistant returns a cached summary; Recommender shows ≥6 related books.
- Arabic RTL toggles correctly across all screens.
- RLS verified by integration tests; no cross-user data leakage.

### 20.2 Launch checklist
**Pre-launch:** all functional requirements tested · AR RTL verified on device · mobile audit passed ·
RLS reviewed · Core Web Vitals LCP <2.5s / CLS <0.1.
**Security:** rate limiting on requests · upload validation · HTTPS+HSTS · admin routes role-gated ·
env vars secured · AI quotas + cost alerts on.
**Go-live:** custom domain + SSL · Sentry active · Vercel Analytics on · seed data (12 categories,
sample listings) · feedback/bug-report link live.

---

## 21. Appendix: Environment, Tooling & Repo Layout

### 21.1 Repository layout
```
BookFlow/
├── frontend/                  # Next.js 14 App Router
│   └── src/
│       ├── app/               # pages + api route handlers
│       ├── components/        # ai/ books/ layout/ requests/ admin/
│       ├── lib/               # api client, supabase clients, design-tokens.json
│       ├── types/index.ts     # all types + enums
│       ├── i18n/request.ts
│       └── middleware.ts      # locale + auth
├── ai-service/                # FastAPI microservice (Railway)
│   ├── main.py · routers/ · services/ · models/schemas.py
│   ├── Dockerfile · railway.toml · requirements.txt
├── supabase/migrations/       # 001..004 sql
├── docs/                      # SRS.md, ARCHITECTURE.md
├── README.md
└── BOOKFLOW_MASTER_PLAN.md    # this file
```

### 21.2 Recommended free tooling (by phase)
| Phase | Tools |
|---|---|
| Vision/strategy | Claude (Projects), Notion AI, Perplexity (market research) |
| Requirements/PM | Claude, Notion AI, Jira Free + Rovo AI |
| Diagrams | Eraser.io, dbdiagram.io, PlantUML |
| UI generation | v0.dev, Figma + Builder.io, Bolt.new |
| API docs/testing | Mintlify, Bruno |
| Build/AI assist | Cursor, Claude |
| Deploy/monitor | Vercel, Railway, Supabase, Sentry, Vercel Analytics |

### 21.3 First-week setup order
1. Create GitHub repo + Supabase project + Vercel project (link git).
2. Apply migrations `001`→`004`; verify RLS in the Supabase dashboard.
3. Scaffold Next.js 14 + Tailwind + shadcn/ui + next-intl (AR/EN).
4. Wire Supabase Auth (email + phone OTP) and the `handle_new_user` trigger.
5. Stand up the FastAPI AI service skeleton + `/health` on Railway.
6. Ship the auth flow end-to-end behind CI before building features.

---

### Closing note
This plan is intentionally exhaustive so it can serve as the contract between business, product, and
engineering. Treat the **MoSCoW priorities** and the **fail-open AI principle** as the two levers that
protect the timeline: if a sprint is at risk, cut "Could" AI features first and keep the core
marketplace flawless. Validate every market and financial number with primary sources before any
external presentation.
