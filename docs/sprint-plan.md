# BookFlow — Sprint Plan
**Sprint 1 | GenAI Hackathon | 7 Days**
**Start:** June 9, 2026 | **End:** June 16, 2026

---

## Sprint Goal
Deliver a fully functional BookFlow MVP with AI features, 13 database modules, bilingual support, admin panel, and deployed to Vercel — ready for hackathon demo.

---

## Daily Breakdown

### Day 1 — Foundation (June 9)
| # | Story | Points | Status |
|---|-------|--------|--------|
| CF-107 | Supabase schema: all 10 modules migration | 5 | ✅ Done |
| CF-108 | Next.js 14 + Stitch design tokens | 3 | ✅ Done |
| CF-109 | Groq + Anthropic universal LLM client | 3 | ✅ Done |

### Day 2 — Core APIs (June 10)
| # | Story | Points | Status |
|---|-------|--------|--------|
| CF-110 | Book listings CRUD + semantic search | 5 | ✅ Done |
| CF-111 | AI chat agent with Groq tool-use | 5 | ✅ Done |

### Day 3 — User Flows (June 11)
| # | Story | Points | Status |
|---|-------|--------|--------|
| CF-112 | User auth + dashboard | 5 | ✅ Done |
| CF-113 | Book request + exchange workflow | 5 | ✅ Done |

### Day 4 — Admin + Notifications (June 12)
| # | Story | Points | Status |
|---|-------|--------|--------|
| CF-114 | Admin reports + moderation log | 5 | ✅ Done |
| CF-115 | Notification drawer | 3 | ✅ Done |

### Day 5 — AI Features (June 13)
| # | Story | Points | Status |
|---|-------|--------|--------|
| CF-116 | AI summarization + TTS + ISBN | 8 | ✅ Done |
| CF-117 | Analytics dashboard | 3 | 🔄 In Progress |

### Day 6 — Polish + Deployment (June 14)
| # | Story | Points | Status |
|---|-------|--------|--------|
| CF-118 | Multi-image upload | 3 | ✅ Done |
| CF-119 | Deploy to Vercel + Railway | 3 | 🔄 In Progress |

### Day 7 — Buffer / Demo Prep (June 15)
| # | Story | Points | Status |
|---|-------|--------|--------|
| — | Final testing + bug fixes | — | Pending |
| — | Demo recording/presentation | — | Pending |
| — | Documentation review | — | Pending |

---

## Sprint Velocity

| Metric | Value |
|--------|-------|
| Total story points | 56 |
| Stories | 13 |
| Team size | 1 |
| Days | 7 |
| Avg points/day | 8 |

---

## Definition of Done

- [ ] Feature works end-to-end (frontend → API → DB)
- [ ] No TypeScript errors
- [ ] Responsive on mobile (375px) and desktop (1440px)
- [ ] Arabic RTL tested
- [ ] All API routes return proper error codes
- [ ] RLS policies prevent unauthorized access

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Groq rate limits | Medium | High | Anthropic fallback implemented |
| Supabase free tier limits | Low | Medium | Optimize queries, limit test data |
| pgvector performance | Low | Medium | Index on embedding column |
| Vercel deployment errors | Low | High | Test locally with `next build` first |

---

## Jira Epic
**CF-106** — BookFlow MVP — GenAI Hackathon 1-Week Sprint
[https://iti46medical.atlassian.net/browse/CF-106](https://iti46medical.atlassian.net/browse/CF-106)

---

## Key Links
- **Eraser Architecture:** https://app.eraser.io/workspace/SJoBG0TvkyDePQOqICpP
- **Miro Diagrams:** https://miro.com/app/board/uXjVHHxNBtA=/?share_link_id=421291780568
- **Vercel:** TBD after deployment
