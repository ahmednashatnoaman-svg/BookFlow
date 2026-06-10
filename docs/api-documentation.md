# BookFlow — API Documentation
**Version:** 1.0 | **Base URL:** `/api`

All endpoints require `Authorization: Bearer <supabase-jwt>` unless marked public.

---

## Books

### `GET /api/books`
Browse and search listings.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search (title, author, description) |
| `category` | uuid | Filter by category ID |
| `condition` | string | `new` \| `good` \| `acceptable` \| `poor` |
| `listing_type` | string | `sale` \| `exchange` |
| `min_price` | number | Minimum price (SAR) |
| `max_price` | number | Maximum price (SAR) |
| `city` | string | City partial match |
| `language` | string | `en` \| `ar` |
| `sort` | string | `newest` \| `price_asc` \| `price_desc` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |

**Response:** `200 OK`
```json
{
  "data": [{ "id": "uuid", "title": "...", "author": "...", "price": 45, "condition": "good", "listing_type": "sale", "cover_image": "https://...", "city": "Riyadh", "category": { "name_en": "Fiction", "icon": "📖" } }],
  "total": 142,
  "page": 1,
  "pages": 8
}
```

### `POST /api/books` *(auth required)*
Create a new listing.

**Body:**
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "category_id": "uuid",
  "condition": "good",
  "listing_type": "sale",
  "price": 55,
  "description": "...",
  "language": "en",
  "city": "Jeddah",
  "cover_image": "https://..."
}
```

**Response:** `201 Created` — created listing object

### `GET /api/books/[id]` *(public)*
Get single listing with full details, category, and user info.

### `PUT /api/books/[id]` *(auth, owner only)*
Update listing fields.

### `DELETE /api/books/[id]` *(auth, owner only)*
Delete listing and associated storage files.

---

## Book Images

### `GET /api/books/[id]/images`
Returns images ordered by `sort_order`.

### `POST /api/books/[id]/images` *(auth, owner)*
Add image. Max 8 per listing.
```json
{ "url": "https://...", "storage_path": "book-images/...", "is_primary": true, "width": 800, "height": 1200 }
```

### `PATCH /api/books/[id]/images` *(auth, owner)*
Set primary image.
```json
{ "image_id": "uuid" }
```

### `DELETE /api/books/[id]/images` *(auth, owner)*
Delete image and remove from storage.
```json
{ "image_id": "uuid" }
```

---

## Requests

### `GET /api/requests` *(auth)*
List requests (sent or received, based on `type` param).

**Query:** `type=sent|received`, `status=pending|accepted|rejected`

### `POST /api/requests` *(auth)*
Create purchase or exchange request.
```json
{
  "listing_id": "uuid",
  "message": "I'm interested!",
  "offer_listing_id": "uuid"  // only for exchange
}
```

### `PUT /api/requests/[id]` *(auth, listing owner)*
Accept or reject request.
```json
{ "action": "accept" | "reject" }
```

---

## Wishlist

### `GET /api/wishlist` *(auth)*
List user's wishlist with availability status.

### `POST /api/wishlist` *(auth)*
Add to wishlist.
```json
{ "listing_id": "uuid" }
```

### `DELETE /api/wishlist/[id]` *(auth)*
Remove from wishlist.

---

## Notifications

### `GET /api/notifications` *(auth)*
**Query:** `unread_only=true`, `limit=20`

**Response:**
```json
{
  "data": [{ "id": "uuid", "type": "request_received", "title": "New Request", "body": "Ahmed wants Clean Code", "read": false, "created_at": "..." }],
  "unread_count": 3
}
```

### `PATCH /api/notifications` *(auth)*
Mark as read.
```json
{ "notification_id": "uuid" }
// OR
{ "mark_all": true }
```

---

## AI Endpoints

### `POST /api/ai/agent`
Natural language book search agent.

**Body:**
```json
{
  "messages": [{ "role": "user", "content": "Find me a programming book under 100 SAR" }],
  "locale": "en"
}
```
**Response:**
```json
{ "response": "I found 3 books matching...", "books": [...] }
```

### `POST /api/ai/summarize`
Generate AI summary for a book.

**Body:** `{ "listing_id": "uuid" }`

**Response:**
```json
{
  "summary": "...",
  "key_themes": ["Clean code", "Refactoring"],
  "target_audience": "Software developers",
  "qa_pairs": [{ "q": "...", "a": "..." }]
}
```

### `POST /api/ai/tts`
Convert text to audio and store in Supabase Storage.

**Body:** `{ "text": "...", "listing_id": "uuid" }`

**Response:** `{ "audio_url": "https://..." }`

### `GET /api/ai/isbn?isbn=9780132350884`
Look up book info by ISBN.

**Response:**
```json
{ "title": "Clean Code", "author": "Robert C. Martin", "cover_image": "https://...", "description": "...", "published_date": "2008-08-11" }
```

### `POST /api/ai/recommend`
Get personalized book recommendations based on wishlist/history.

**Body:** `{ "limit": 10 }`

---

## Admin Endpoints *(admin role required)*

### `GET /api/admin/reports`
**Query:** `status=pending|reviewing|resolved|dismissed|all`, `page`, `limit`

### `PATCH /api/admin/reports`
```json
{ "report_id": "uuid", "action": "resolve" | "dismiss", "note": "..." }
```

### `GET /api/admin/moderation`
Paginated moderation audit log.

### `POST /api/admin/moderation`
Perform moderation action.
```json
{ "action": "suspend_user" | "unsuspend_user" | "remove_listing" | "restore_listing", "target_id": "uuid", "reason": "..." }
```

### `GET /api/admin/analytics`
**Response:**
```json
{
  "stats": { "total_listings": 142, "active_listings": 118, "total_users": 89, "total_exchanges": 23, "total_sales": 45, "pending_requests": 12, "open_reports": 3 },
  "growth_data": [{ "date": "2026-06-01", "listings": 5, "users": 12, "transactions": 3 }],
  "categories_breakdown": [{ "name": "Fiction", "count": 45, "available": 38 }],
  "top_requested_books": [{ "title": "...", "author": "...", "request_count": 8 }]
}
```

---

## Upload

### `POST /api/upload/image` *(auth)*
Upload image to Supabase Storage.

**Body:** `FormData` with `file` field (image/jpeg, image/png, image/webp, max 5MB)

**Response:** `{ "url": "https://...", "storage_path": "book-images/user_id/filename.jpg" }`

---

## Error Responses

| Status | Description |
|--------|-------------|
| `400` | Bad request — invalid parameters |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — insufficient permissions |
| `404` | Not found |
| `422` | Validation error |
| `429` | Rate limited |
| `500` | Internal server error |

All errors return: `{ "error": "description" }`
