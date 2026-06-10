# BookFlow — Vision Document
**GenAI Hackathon | Saudi Arabia / MENA Region**
**Date:** June 2026 | **Version:** 1.0

---

## 1. Executive Summary

BookFlow is an AI-powered peer-to-peer book exchange platform designed for the MENA region, with a focus on Saudi Arabia. It enables readers to buy, sell, and exchange used books locally — reducing waste, lowering costs, and building community around shared love of reading.

The platform differentiates through embedded AI: a conversational search agent (Arabic/English), auto-generated book summaries with audio, semantic search via vector embeddings, and personalized recommendations.

---

## 2. Problem Statement

- **High book prices** in MENA make reading inaccessible for many students and casual readers
- **No trusted local platform** for used book exchange between peers (unlike Craigslist or eBay, which lack trust and book-specific UX)
- **Language barrier** — most book platforms are English-only, excluding Arabic-speaking users
- **Discovery friction** — finding specific genres or conditions requires manual scrolling
- **Waste** — millions of books sit unread on shelves after a single use

---

## 3. Vision Statement

> *"Make every book find its next reader — intelligently, locally, and in your language."*

BookFlow will become the go-to marketplace for used books in Saudi Arabia and the broader MENA region, powered by AI that understands what you want to read before you can fully describe it.

---

## 4. Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| **Student** | University/school student in KSA | Buy textbooks cheaply, sell after semester |
| **Casual Reader** | Adult reader (fiction/non-fiction) | Exchange books after reading |
| **Collector** | Rare/used book enthusiast | Find specific editions, connect with sellers |
| **Admin** | Platform moderator | Manage listings, users, reports |

---

## 5. Key Features

### Core
- Browse and search books with text, filters, and AI-powered semantic search
- List books for sale or exchange with multi-image upload
- Send purchase or exchange requests with built-in messaging
- Wishlist with automatic availability notifications

### AI Features
- **AI Chat Agent**: Conversational book search using Groq Llama3 with tool-use (Arabic + English)
- **Book Summarizer**: Auto-generated summaries with key themes, audience info, Q&A pairs
- **Audio Summary (TTS)**: Listen to book summaries while browsing
- **Semantic Search**: pgvector 384-dim embeddings for conceptual similarity
- **ISBN Auto-fill**: Scan ISBN to auto-populate listing fields

### Platform
- Bilingual UI (Arabic RTL + English LTR)
- Mobile-responsive glassmorphism design
- Admin panel with reports, moderation, and analytics
- Real-time notifications

---

## 6. Success Metrics (MVP)

| Metric | Target (Week 1 Post-Launch) |
|--------|----------------------------|
| Listings created | > 50 |
| AI chat sessions | > 100 |
| Exchange requests | > 20 |
| User registrations | > 200 |
| Mobile NPS | > 40 |

---

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL 16 + pgvector + Auth + Storage + Realtime) |
| AI Service | FastAPI (Python) on Railway |
| LLM | Groq Llama3-70B (primary), Claude claude-sonnet-4-6 (fallback) |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 (384-dim) |
| Hosting | Vercel (frontend), Railway (AI service) |
| Design | Stitch "BookFlow Narrative" design system |

---

## 8. Constraints

- **Free-tier LLMs first** — Groq API (free) preferred over paid OpenAI/Anthropic
- **Supabase free tier** for hackathon (500 MB DB, 1 GB storage)
- **1-week development sprint** — focus on core flows only, no payments
- **MENA legal** — no transactions in SAR for MVP; price display only

---

## 9. Out of Scope (MVP)

- Payment processing (Mada, Apple Pay, STC Pay)
- Mobile app (iOS/Android)
- Shipping integration
- Book rating/review system
- Social following/friend features
