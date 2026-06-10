<div align="center">

# 📚 BookFlow

### Egypt's AI-Powered Peer-to-Peer Book Marketplace

*Buy · Sell · Exchange used books with smart AI search, Arabic voice summaries, and real-time notifications*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_16-green?logo=supabase)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq-Llama3_70B-orange)](https://groq.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-red?logo=fastapi)](https://fastapi.tiangolo.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

**[🚀 Live Demo](https://bookflow.vercel.app)** · **[📖 Docs](#-documentation-hub)** · **[🗄 ERD](#-erd--database-design)** · **[🎨 Wireframes](#-wireframes)** · **[📓 NotebookLM Presentation](#-notebooklm-presentation)** · **[📊 Sprint Plan](#-sprint-plan)**

</div>

---

## 📖 Vision Document

BookFlow is a **GenAI Hackathon** submission — an AI-native marketplace solving Egypt's used-book distribution problem. Millions of students and readers discard or shelve books they no longer need while others struggle to find affordable copies. BookFlow bridges that gap with:

| Pillar | What We Built |
|--------|--------------|
| **Marketplace** | Post, discover, and exchange / sell used books with photo uploads, condition grading, and city-based filtering |
| **AI Search** | Natural-language search via Groq Llama3-70B — "find me a thriller under 100 EGP in Giza" |
| **Arabic AI** | Full bilingual AI assistant with automatic Arabic ↔ English query translation |
| **AI Summaries** | One-click book summaries from FastAPI + Groq with Text-to-Speech audio playback |
| **Semantic Recommendations** | pgvector embeddings for "books like this" discovery |
| **Admin Panel** | Full moderation suite — suspend users, remove listings, resolve reports, analytics |

> 📄 **Full Vision Document →** [docs/vision-document.md](docs/vision-document.md) · [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) · [Confluence](https://iti46medical.atlassian.net/wiki/x/AgBNAQ)

---

## 📑 Requirements Specification

### Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| FR-01 | Auth | Email + OTP phone login via Supabase Auth |
| FR-02 | Listings | Create / edit / delete listings with multi-image upload |
| FR-03 | Search | Full-text + filter search (price, condition, city, type) |
| FR-04 | AI Search | NLP chat agent for conversational book discovery |
| FR-05 | Requests | Contact-seller request system with message + offer-exchange option |
| FR-06 | Notifications | Real-time notifications for requests, acceptances, wishlist alerts |
| FR-07 | AI Summary | AI-generated book summary with Arabic TTS audio |
| FR-08 | Recommendations | pgvector semantic similarity recommendations |
| FR-09 | Wishlist | Save listings; get notified when relisted |
| FR-10 | Admin | User moderation, report resolution, analytics dashboard |

### Non-Functional Requirements

| NFR | Target |
|-----|--------|
| Performance | < 2 s page load (Vercel Edge + ISR) |
| Availability | 99.9% (Vercel + Supabase SLA) |
| Security | RLS on all tables, service-role restricted to server RPCs |
| Accessibility | WCAG AA contrast, RTL-first layout with `next-intl` |
| i18n | Full Arabic + English UI with automatic locale detection |

> 📄 **Full Spec →** [docs/requirements-specification.md](docs/requirements-specification.md) · [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27)

---

## 👥 User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|---------|
| US-01 | Reader | Search for books by natural language | I find exactly what I need without rigid filters |
| US-02 | Seller | Post a used book with photos and price | Buyers can discover and contact me |
| US-03 | Buyer | Contact a seller with a message or exchange offer | I can arrange a deal |
| US-04 | User | Hear an AI summary of a book in Arabic | I decide if it's worth buying without reading a sample |
| US-05 | User | Add books to my wishlist | I get notified when they're available |
| US-06 | User | Switch the app to Arabic | I use it comfortably in my native language |
| US-07 | User | See books near my city | I avoid long-distance pickups |
| US-08 | Seller | Accept or reject incoming requests | I control who gets my book |
| US-09 | Admin | Suspend abusive accounts | The platform stays safe |
| US-10 | Admin | View platform analytics | I track growth and health |
| US-11 | User | Get real-time notifications | I never miss a request or update |
| US-12 | User | Chat with an AI assistant in Arabic | I get help in my preferred language |
| US-13 | Buyer | See similar book recommendations | I discover more titles I'll enjoy |
| US-14 | User | View my transaction history | I track what I've bought and sold |
| US-15 | Admin | Resolve reported listings | I keep content policy enforced |

> 📋 **Jira Stories** → [CF-121](https://iti46medical.atlassian.net/browse/CF-121) · [CF-122](https://iti46medical.atlassian.net/browse/CF-122) · [CF-123](https://iti46medical.atlassian.net/browse/CF-123) · [CF-124](https://iti46medical.atlassian.net/browse/CF-124) · [CF-125](https://iti46medical.atlassian.net/browse/CF-125) · [CF-126](https://iti46medical.atlassian.net/browse/CF-126)
>
> 📄 **Full User Stories →** [docs/user-stories.md](docs/user-stories.md) · [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27)

---

## 🔄 Use Case Diagram

The system serves three actor roles: **Guest**, **Authenticated User**, and **Admin**.

```
┌─────────────────────────────────────────────────────────────────┐
│                         BookFlow System                          │
│                                                                  │
│  Guest ──────┬──▶ Browse Listings                               │
│              ├──▶ Search Books (text/filter)                    │
│              └──▶ View Listing Detail                           │
│                                                                  │
│  User ───────┬──▶ [Guest use cases]                             │
│              ├──▶ Post / Edit / Delete Listing                  │
│              ├──▶ Upload Book Images                            │
│              ├──▶ Chat with AI Assistant (EN/AR)                │
│              ├──▶ Request AI Book Summary + TTS                 │
│              ├──▶ Send Contact Request to Seller                │
│              ├──▶ Accept / Reject Incoming Requests             │
│              ├──▶ Add to Wishlist                               │
│              ├──▶ View Notifications (real-time)                │
│              ├──▶ Mark Notifications as Read                    │
│              ├──▶ View Transaction History                      │
│              └──▶ Report Abusive Listing                        │
│                                                                  │
│  Admin ──────┬──▶ [User use cases]                              │
│              ├──▶ View Analytics Dashboard                      │
│              ├──▶ Suspend / Reinstate Users                     │
│              ├──▶ Remove Listings                               │
│              └──▶ Resolve / Dismiss Reports                     │
└─────────────────────────────────────────────────────────────────┘
```

> 🎨 **Interactive Miro Use Case Diagram →** [View on Miro](https://miro.com/app/board/uXjVHHxNBtA=/)

---

## 🗄 ERD — Database Design

**10 tables** across 5 functional domains, all in PostgreSQL 16 with Row Level Security.

```
┌─────────────────────┐     ┌─────────────────────┐
│   user_profiles     │     │      categories      │
│─────────────────────│     │─────────────────────│
│ id (PK, auth FK)    │     │ id (PK)             │
│ full_name           │     │ name_en / name_ar   │
│ avatar_url          │     │ icon, sort_order    │
│ city, bio, phone    │     │ is_active           │
│ role (user/admin)   │     └──────────┬──────────┘
└──────────┬──────────┘                │ FK
           │ FK (user_id)             ▼
           │          ┌─────────────────────────────┐
           │          │        book_listings         │
           │          │─────────────────────────────│
           │          │ id (PK)                     │
           └─────────▶│ user_id (FK → user_profiles)│
                      │ category_id (FK → categories)│
                      │ title, author, isbn         │
                      │ condition, listing_type     │
                      │ price, currency (EGP)       │
                      │ status, city, language      │
                      │ cover_image, description    │
                      │ embedding (vector/pgvector) │
                      └─────┬───────────────────────┘
                            │
           ┌────────────────┼──────────────────────┐
           │                │                      │
           ▼                ▼                      ▼
┌──────────────────┐ ┌─────────────┐  ┌──────────────────┐
│  book_requests   │ │  wishlist   │  │  book_images     │
│──────────────────│ │─────────────│  │──────────────────│
│ id (PK)          │ │ id (PK)     │  │ id (PK)          │
│ listing_id (FK)  │ │ listing_id  │  │ listing_id (FK)  │
│ requester_id(FK) │ │ user_id     │  │ url, storage_path│
│ offer_listing_id │ └─────────────┘  │ is_primary       │
│ status, message  │                  └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────────┐
│   transactions   │     │    notifications      │
│──────────────────│     │──────────────────────│
│ id (PK)          │     │ id (PK)              │
│ listing_id (FK)  │     │ user_id (FK)         │
│ seller_id (FK)   │     │ type, title, body    │
│ buyer_id (FK)    │     │ data (JSONB)         │
│ request_id (FK)  │     │ read (bool)          │
│ type, completed_at│    └──────────────────────┘
└──────────────────┘
                          ┌──────────────────┐
                          │     reports      │
                          │──────────────────│
                          │ id (PK)          │
                          │ reporter_id (FK) │
                          │ listing_id (FK)  │
                          │ reason, status   │
                          │ admin_note       │
                          └──────────────────┘
```

**Key design decisions:**
- `pgvector` on `book_listings.embedding` for semantic search (cosine similarity)
- `UNIQUE(listing_id, requester_id)` on `book_requests` prevents duplicate requests
- `SECURITY DEFINER` RPCs (`accept_request`, `search_listings`) bypass RLS for complex atomic ops
- Notification types enforced by CHECK constraint across 10 event types
- Full RBAC via `role_permissions` table + `has_permission()` helper

> 🎨 **Interactive Miro ERD →** [View full diagram on Miro](https://miro.com/app/board/uXjVHHxNBtA=/?moveToWidget=3458764674998098318)
>
> 📂 **Migrations →** [supabase/migrations/](supabase/migrations/) (7 migration files, 001–007)

---

## 🌐 API Documentation

### Frontend API Routes (`/api/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/books` | Public | List/search listings with filters |
| `POST` | `/api/books` | User | Create a new listing |
| `GET` | `/api/books/[id]` | Public | Get listing detail |
| `PATCH` | `/api/books/[id]` | Owner | Update listing |
| `DELETE` | `/api/books/[id]` | Owner | Delete listing |
| `GET` | `/api/books/[id]/images` | Public | Get listing images |
| `POST` | `/api/books/[id]/images` | Owner | Upload image to storage |
| `POST` | `/api/requests` | User | Send contact/exchange request |
| `GET` | `/api/requests` | User | Get sent/received requests |
| `PATCH` | `/api/requests/[id]` | Owner | Accept or reject request |
| `GET` | `/api/notifications` | User | Get notifications (paginated) |
| `PATCH` | `/api/notifications` | User | Mark all as read |
| `POST` | `/api/ai/agent` | Public | AI chat agent (NLP book search) |
| `POST` | `/api/ai/chat` | Public | Book-specific AI chat |
| `POST` | `/api/ai/summarize` | Public | AI book summary |
| `POST` | `/api/ai/tts` | Public | Text-to-speech audio |
| `GET/POST` | `/api/admin/*` | Admin | Admin moderation endpoints |

### FastAPI AI Service (Railway)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/summarize` | AI book summary via Groq Llama3-70B |
| `POST` | `/recommend/embed` | Generate pgvector embeddings |
| `POST` | `/recommend/similar` | Find semantically similar books |

> 📄 **Full API Reference →** [docs/api-documentation.md](docs/api-documentation.md) · [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27)

---

## 🎨 Wireframes

Designed in **Google Stitch** — AI-generated UI screens matching the BookFlow design system (deep navy + violet + teal).

> 🎨 **Interactive Wireframes →** [View Stitch Project](https://stitch.google.com)

### Design System

| Token | Value |
|-------|-------|
| Primary | `#7C3AED` (violet-700) |
| Accent | `#2DD4BF` (teal-400) |
| Background | `#0F0F1A` (deep navy) |
| Surface | `rgba(255,255,255,0.05)` glassmorphism |
| Font | System sans (RTL-aware via Tailwind) |
| Radius | `xl` (12px) cards, `2xl` (16px) inputs |

### Key Screens

| Screen | Description |
|--------|-------------|
| **Home** | Hero search bar, featured listings grid, category chips |
| **Book Detail** | Multi-image gallery, AI summary button, TTS player, request modal |
| **AI Chat** | Floating chat UI with book result cards, Arabic mode auto-detect |
| **Dashboard** | Posted listings, incoming requests, transaction history tabs |
| **Admin Panel** | Analytics overview, user management, report queue |

---

## 📓 NotebookLM Presentation

An interactive AI-generated audio/text presentation of BookFlow was created using Google NotebookLM. It offers a structured walkthrough of the project vision, hackathon milestones, architecture, and core features.

> 📓 **NotebookLM Presentation & Artifacts →** [View NotebookLM Presentation](https://notebooklm.google.com/notebook/b87b9029-6d99-477c-8818-4176af814a26/artifact/8353f781-dd2b-4bc4-97c0-875f4ef50f26?utm_source=nlmm_share)

---

## 📊 Sprint Plan

**Sprint Duration:** 7 days · **Epic:** [CF-120](https://iti46medical.atlassian.net/browse/CF-120) — BookFlow GenAI Hackathon

| Day | Milestone | Jira |
|-----|-----------|------|
| Day 1–2 | Auth, DB schema (7 migrations), RLS policies | CF-121 |
| Day 2–3 | Listing CRUD, image upload, search with filters | CF-122 |
| Day 3–4 | AI agent (Groq Llama3), Arabic mode, TTS | CF-123 |
| Day 4–5 | Request system, notifications, wishlist | CF-124 |
| Day 5–6 | Admin panel, moderation, analytics | CF-125 |
| Day 6–7 | pgvector recommendations, FastAPI service | CF-126 |
| Day 7 | Polish, bug fixes, Vercel deployment | — |

> 📋 **Jira Epic →** [CF-120](https://iti46medical.atlassian.net/browse/CF-120) · **Board →** [CF Project](https://iti46medical.atlassian.net/jira/software/projects/CF/boards)
>
> 📄 **Sprint Plan Doc →** [docs/sprint-plan.md](docs/sprint-plan.md)

---

## 🚀 Final Working MVP

### What's Shipped

- [x] **Listing marketplace** — create, browse, filter, search with 7 condition/type/city/price filters
- [x] **AI book assistant** — NLP chat in English + Arabic, auto-translates Arabic queries to English for search
- [x] **AI book summary + TTS** — one-click Groq summary, Arabic/English audio via Web Speech API
- [x] **pgvector recommendations** — semantic "books like this" via FastAPI embeddings service
- [x] **Request system** — contact seller, offer-exchange, accept/reject with notifications
- [x] **Real-time notifications** — drawer with unread badge, mark-all-read
- [x] **Wishlist + alerts** — save listings, trigger on relist
- [x] **Admin dashboard** — user suspension, listing removal, report queue, growth analytics
- [x] **Full RTL Arabic UI** — `next-intl` with automatic locale detection
- [x] **Multi-image upload** — Supabase Storage with primary image promotion
- [x] **Auth** — email/password + OTP phone number login

### Tech Stack

```
Frontend          Next.js 14 App Router · TypeScript 5.7 · Tailwind CSS 3
UI Components     Radix UI · Framer Motion · Lucide Icons · Recharts
State             Zustand · React hooks
i18n              next-intl (Arabic RTL + English)
Backend (API)     Next.js Route Handlers (server-side)
AI/LLM            Groq Llama3-70B (chat + summarization) · Web Speech API (TTS)
AI Service        FastAPI (Python) on Railway — embeddings + recommendations
Database          Supabase PostgreSQL 16 · pgvector · Row Level Security
Auth              Supabase Auth (email + OTP phone)
Storage           Supabase Storage (book images)
Deployment        Vercel (frontend) · Railway (AI service)
```

---

## 📂 Project Structure

```
BookFlow/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # Route handlers
│   │   │   │   ├── ai/          # agent, chat, summarize, tts
│   │   │   │   ├── books/       # CRUD + images
│   │   │   │   ├── requests/    # Contact/exchange requests
│   │   │   │   ├── notifications/
│   │   │   │   └── admin/       # Moderation APIs
│   │   │   ├── (pages)/         # App pages
│   │   │   ├── auth/            # Login, register, OTP
│   │   │   ├── dashboard/       # User dashboard
│   │   │   ├── admin/           # Admin panel
│   │   │   └── chat/            # AI assistant
│   │   ├── components/
│   │   │   └── layout/          # Header, NotificationDrawer
│   │   └── lib/
│   │       └── supabase/        # Client, server, middleware
│   └── package.json
├── ai-service/                  # FastAPI Python service
│   ├── routers/
│   │   └── summarization.py
│   └── services/
│       └── llm_client.py
├── supabase/
│   └── migrations/              # 001–007 SQL migrations
├── docs/                        # Specification documents
│   ├── vision-document.md
│   ├── requirements-specification.md
│   ├── user-stories.md
│   ├── api-documentation.md
│   └── sprint-plan.md
└── README.md
```

---

## 📚 Documentation Hub

| Document | Local | Notion | Confluence | Jira / Tools |
|----------|-------|--------|-----------|--------------|
| 📖 Vision Document | [docs/vision-document.md](docs/vision-document.md) | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | [Confluence](https://iti46medical.atlassian.net/wiki/x/AgBNAQ) | — |
| 📑 Requirements | [docs/requirements-specification.md](docs/requirements-specification.md) | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | [Confluence](https://iti46medical.atlassian.net/wiki/x/AoBMAQ) | — |
| 👥 User Stories | [docs/user-stories.md](docs/user-stories.md) | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | — | [CF Epic](https://iti46medical.atlassian.net/browse/CF-120) |
| 🔄 Use Case Diagram | — | — | — | [Miro Board](https://miro.com/app/board/uXjVHHxNBtA=/) |
| 🗄 ERD | [supabase/migrations/](supabase/migrations/) | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | — | [Miro ERD](https://miro.com/app/board/uXjVHHxNBtA=/?moveToWidget=3458764674998098318) |
| 🌐 API Docs | [docs/api-documentation.md](docs/api-documentation.md) | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | — | — |
| 🎨 Wireframes | — | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | — | [Stitch Project](https://stitch.google.com) |
| 🏗 System Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | — | — | [Eraser Diagram](https://app.eraser.io/workspace/6Ixh5SP3Na5IyxrYWAmr) |
| 📓 Presentation Slides | — | — | — | [NotebookLM Presentation](https://notebooklm.google.com/notebook/b87b9029-6d99-477c-8818-4176af814a26/artifact/8353f781-dd2b-4bc4-97c0-875f4ef50f26?utm_source=nlmm_share) |
| 📊 Sprint Plan | [docs/sprint-plan.md](docs/sprint-plan.md) | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | — | [CF-120](https://iti46medical.atlassian.net/browse/CF-120) |
| 🚀 MVP | This README | [Notion](https://app.notion.com/p/37bab3f8c55d81a6a592cde7ef903e27) | [Confluence Hub](https://iti46medical.atlassian.net/wiki/x/AoBMAQ) | — |

---

## ⚙️ Local Setup

```bash
# 1. Clone
git clone https://github.com/ahmednashatnoaman-svg/BookFlow.git
cd BookFlow/frontend

# 2. Install dependencies
npm install

# 3. Environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, AI_SERVICE_URL

# 4. Apply database migrations
# In Supabase dashboard → SQL editor → run each migration in supabase/migrations/

# 5. Run development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server only) |
| `GROQ_API_KEY` | ✅ | Groq API key for AI features |
| `AI_SERVICE_URL` | ⬜ | FastAPI service URL (recommendations) |
| `AI_SERVICE_SECRET` | ⬜ | Secret for AI service auth |

---

## 🤝 Contributing

This project was built for the **GenAI Hackathon**. PRs are welcome for bug fixes and improvements.

---

## 📄 License

MIT © BookFlow Team 2026

