# BookFlow — Software Requirements Specification (SRS)
**Version:** 1.0 | **Date:** June 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for BookFlow — an AI-powered peer-to-peer book exchange platform for the MENA region.

### 1.2 Scope
BookFlow is a web application enabling users to list, discover, buy, sell, and exchange used books locally. AI features include conversational search, book summarization, TTS audio, semantic search, and ISBN auto-fill.

### 1.3 Definitions
| Term | Definition |
|------|------------|
| **Listing** | A book posted by a user with metadata, images, and price/exchange offer |
| **Request** | A user's expression of intent to purchase or exchange a listed book |
| **Exchange** | A swap of two books between two users without monetary transaction |
| **RLS** | Row-Level Security — Supabase database access control |
| **RPC** | Remote Procedure Call — Supabase PostgreSQL functions |
| **pgvector** | PostgreSQL extension for vector similarity search |

---

## 2. System Overview

### 2.1 Architecture
```
Browser (Next.js 14 on Vercel)
    ↓ REST API Routes
Supabase (PostgreSQL + pgvector + Auth + Storage + Realtime)
    ↓ HTTP
FastAPI (Python on Railway) — AI Service
    ↓ API Calls
Groq API (Llama3) / Anthropic API (Claude)
```

### 2.2 User Roles
- **Guest**: Browse listings (read-only, no auth required)
- **User**: Full platform access (listing, requesting, wishlist, chat)
- **Admin**: Platform management (moderation, reports, analytics)
- **Suspended**: Login allowed but all write actions blocked

---

## 3. Functional Requirements

### 3.1 Authentication (AUTH)

| ID | Requirement |
|----|-------------|
| AUTH-01 | System SHALL support email + password registration |
| AUTH-02 | System SHALL support magic link (OTP) login via Supabase |
| AUTH-03 | System SHALL create user_profiles record on first login |
| AUTH-04 | System SHALL enforce role-based access via has_permission() RPC |
| AUTH-05 | System SHALL redirect unauthenticated users to /auth/login for protected routes |

### 3.2 Book Listings (BOOK)

| ID | Requirement |
|----|-------------|
| BOOK-01 | Users SHALL create listings with: title, author, ISBN, category, condition, type (sale/exchange), price, description, language, city |
| BOOK-02 | System SHALL support upload of up to 8 images per listing |
| BOOK-03 | System SHALL auto-generate 384-dim embeddings via sentence-transformers on listing creation |
| BOOK-04 | System SHALL trigger AI summarization asynchronously when a listing is created |
| BOOK-05 | Guests and users SHALL search listings using full-text search (FTS) and pgvector semantic search |
| BOOK-06 | System SHALL support filters: condition, type, price range, category, city, language |
| BOOK-07 | Users SHALL only edit/delete their own listings |
| BOOK-08 | Listing status transitions: available → sold/exchanged/removed |

### 3.3 Requests & Exchange (REQ)

| ID | Requirement |
|----|-------------|
| REQ-01 | Users SHALL send purchase requests for sale listings |
| REQ-02 | Users SHALL send exchange requests, specifying an offer listing they own |
| REQ-03 | System SHALL validate exchange offers via validate_exchange_offer() RPC (confirms ownership) |
| REQ-04 | Listing owners SHALL accept or reject requests |
| REQ-05 | Accepting a request SHALL mark the listing as sold/exchanged and create a transaction |
| REQ-06 | System SHALL log all status transitions in request_events table |
| REQ-07 | Accepting an exchange SHALL use complete_exchange() RPC to update both listings |

### 3.4 Wishlist (WISH)

| ID | Requirement |
|----|-------------|
| WISH-01 | Users SHALL add any listing to their wishlist |
| WISH-02 | System SHALL send wishlist_available notification when a wishlisted book becomes available |
| WISH-03 | Wishlist page SHALL show real-time availability status |

### 3.5 Notifications (NOTIF)

| ID | Requirement |
|----|-------------|
| NOTIF-01 | System SHALL create notifications for: request_received, request_accepted, request_rejected, wishlist_available, exchange_completed, listing_removed, account_suspended |
| NOTIF-02 | Header SHALL display unread count badge |
| NOTIF-03 | Users SHALL mark individual or all notifications as read |
| NOTIF-04 | Notification drawer SHALL poll every 30 seconds |

### 3.6 AI Features (AI)

| ID | Requirement |
|----|-------------|
| AI-01 | System SHALL provide an AI chat agent that accepts natural language queries (Arabic + English) |
| AI-02 | AI agent SHALL use Groq Llama3 tool-use to query real book listings from the database |
| AI-03 | System SHALL fall back to Anthropic claude-sonnet-4-6 if all Groq models fail |
| AI-04 | System SHALL generate book summaries using Groq Llama3, including: overview, key themes, audience, 3 Q&A pairs |
| AI-05 | System SHALL convert summaries to audio (TTS) and store in Supabase Storage |
| AI-06 | System SHALL look up book metadata from ISBN via Google Books API (with OpenLibrary fallback) |
| AI-07 | System SHALL generate semantic search recommendations based on user's wishlist and history |

### 3.7 Admin (ADMIN)

| ID | Requirement |
|----|-------------|
| ADMIN-01 | Admins SHALL view, resolve, and dismiss user-submitted reports |
| ADMIN-02 | Admins SHALL suspend users via suspend_user() RPC |
| ADMIN-03 | Admins SHALL remove listings via admin_remove_listing() RPC |
| ADMIN-04 | All admin actions SHALL be logged in moderation_logs table |
| ADMIN-05 | Admins SHALL view platform analytics: user growth, listing stats, top requested books, category breakdown |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load time < 2 seconds (LCP) on desktop
- API response time < 500ms for listing queries
- AI agent response time < 5 seconds (including tool-use)
- Semantic search query < 300ms with pgvector index

### 4.2 Security
- All write operations require valid Supabase JWT
- RLS policies enforce row-level access on all tables
- API routes validate user ownership before mutations
- File uploads limited to 5MB, image types only
- Admin routes check `is_admin()` RPC, return 403 otherwise

### 4.3 Scalability
- Supabase connection pooling via PgBouncer
- Stateless Next.js API routes (horizontal scaling via Vercel)
- FastAPI async endpoints (non-blocking I/O)
- pgvector HNSW index for sub-linear similarity search

### 4.4 Availability
- Supabase: 99.9% uptime SLA
- Vercel: 99.99% uptime SLA
- Groq: Fallback to Anthropic if unavailable

### 4.5 Usability
- Fully responsive: mobile (375px) through desktop (1440px)
- Bilingual: English (LTR) and Arabic (RTL)
- WCAG 2.1 AA color contrast compliance
- Keyboard navigable

### 4.6 Maintainability
- TypeScript strict mode throughout frontend
- Supabase migrations versioned in /supabase/migrations/
- All AI prompts externalized (not hardcoded in handlers)
- Environment variables for all secrets (no hardcoded keys)

---

## 5. Database Requirements

### 5.1 Tables
13 core tables: user_profiles, categories, book_listings, book_images, book_requests, request_events, wishlist, notifications, transactions, transaction_events, reports, moderation_logs, role_permissions

### 5.2 Constraints
- All tables use UUID primary keys
- Timestamps use TIMESTAMPTZ (not TIMESTAMP)
- Cascading deletes on child records when parent is deleted
- RLS enabled on all tables; no public access without policy

### 5.3 Indexes
- book_listings: FTS index (tsvector), embedding index (ivfflat/hnsw), status+created_at
- book_images: listing_id, unique partial on is_primary
- notifications: user_id + read (unread queries)
- transactions: seller_id, buyer_id

---

## 6. External Interfaces

| System | Purpose | Fallback |
|--------|---------|---------|
| Groq API | Primary LLM (Llama3) | Anthropic Claude |
| Anthropic API | Fallback LLM (claude-sonnet-4-6) | Error response |
| Supabase | Database + Auth + Storage + Realtime | None (critical) |
| OpenAI TTS | Audio summary generation | None (feature disabled) |
| Google Books API | ISBN metadata lookup | OpenLibrary API |
| Vercel | Frontend hosting | None (critical) |
| Railway | FastAPI AI service hosting | None (AI features disabled) |
