# BookFlow — User Stories
**Sprint 1 | GenAI Hackathon**

---

## Epic: Book Discovery & Browsing

**US-01** — As a guest, I want to browse available books by category and condition so that I can find books I'm interested in without creating an account.
- **AC:** Books listed with title, author, cover, price/exchange badge, condition, city
- **AC:** Filter by: category, condition (new/good/acceptable/poor), listing type (sale/exchange), city, language
- **AC:** Sort by: newest, price low-high, price high-low

**US-02** — As a user, I want to use the AI chat assistant to find books by describing what I want in natural language so that I don't need to manually apply filters.
- **AC:** Chat accepts Arabic and English inputs
- **AC:** AI uses tool-use to query real listings
- **AC:** Response shows matched books with key details
- **AC:** Graceful "no results" with filter suggestions

**US-03** — As a user, I want to scan an ISBN barcode when listing a book so that the title, author, and cover are auto-filled.
- **AC:** ISBN lookup via Google Books API
- **AC:** Falls back to OpenLibrary if Google Books fails
- **AC:** User can override any auto-filled field

**US-04** — As a user, I want to see an AI-generated summary of a book with audio playback so that I can decide whether to request it without reading reviews.
- **AC:** Summary appears on book detail page
- **AC:** Audio button plays TTS version of summary
- **AC:** Summary includes: overview, key themes, target audience, 3 Q&A pairs

---

## Epic: Listing Management

**US-05** — As a user, I want to list a book for sale or exchange so that other users can find and request it.
- **AC:** Form fields: title, author, ISBN, category, condition, listing type, price (if sale), description, language, city
- **AC:** Upload up to 8 images; first image becomes cover
- **AC:** Listing goes to "available" status immediately
- **AC:** AI summary auto-generated in background

**US-06** — As a user, I want to edit or delete my active listings so that I can keep my inventory up to date.
- **AC:** Edit all fields except listing type
- **AC:** Delete removes listing and all associated images from storage
- **AC:** Cannot delete if there is a pending/accepted request

**US-07** — As a user, I want to add books to my wishlist so that I get notified when they become available.
- **AC:** Heart icon on any listing adds to wishlist
- **AC:** Notification sent when wishlisted book relists or becomes available
- **AC:** Wishlist page shows is_available status for each entry

---

## Epic: Requests & Exchange

**US-08** — As a user, I want to send a purchase request for a book so that the seller knows I'm interested.
- **AC:** Request button on book detail page (not own listings)
- **AC:** Optional message to seller
- **AC:** Seller gets notification: "New request for [Book Title]"
- **AC:** Request status: pending → accepted/rejected

**US-09** — As a user, I want to propose a book exchange by offering one of my listings so that I can trade without spending money.
- **AC:** Exchange request includes offer_listing_id (must own the offered book)
- **AC:** validate_exchange_offer() RPC confirms ownership
- **AC:** Seller sees which book is offered in request inbox

**US-10** — As a seller, I want to accept or reject book requests from my dashboard so that I can manage my listings.
- **AC:** Request inbox shows all pending requests with requester name, message, and offer (if exchange)
- **AC:** Accept triggers accept_request() RPC: marks listing as sold/exchanged, creates transaction
- **AC:** Reject sends notification to requester

---

## Epic: Notifications

**US-11** — As a user, I want to see real-time notifications in my header so that I don't miss important updates.
- **AC:** Bell icon with unread count badge
- **AC:** Dropdown shows last 20 notifications with type icon, title, timestamp
- **AC:** Click marks as read and navigates to relevant listing
- **AC:** "Mark all as read" button

---

## Epic: Admin

**US-12** — As an admin, I want to view and resolve user-submitted reports so that harmful listings are removed promptly.
- **AC:** Reports table filterable by status (pending/reviewing/resolved/dismissed)
- **AC:** Resolve modal with optional admin note
- **AC:** Dismiss removes from queue without action

**US-13** — As an admin, I want to view the moderation audit log so that all admin actions are traceable.
- **AC:** Full history of: listing_removed, listing_restored, user_suspended, user_unsuspended, report_resolved
- **AC:** Shows admin name, action, target, reason, timestamp
- **AC:** Paginated, 25 per page

**US-14** — As an admin, I want to see platform analytics with growth charts so that I can monitor health of the marketplace.
- **AC:** Stats cards: total listings, active listings, total users, exchanges, sales, open reports
- **AC:** 30-day growth line chart (listings vs users vs transactions)
- **AC:** Category breakdown pie chart
- **AC:** Top 10 most requested books

---

## Epic: Internationalization

**US-15** — As an Arabic-speaking user, I want the UI to display in Arabic with RTL layout so that I can use the platform comfortably in my language.
- **AC:** Toggle between Arabic and English in header
- **AC:** RTL layout for Arabic (direction: rtl)
- **AC:** All navigation labels, buttons, form fields translated
- **AC:** AI chat responds in the language used by the user
