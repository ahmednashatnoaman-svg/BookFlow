import type {
  BookListing, BookRequest, WishlistItem, Transaction,
  SearchFilters, PaginatedResponse, AIBookSummary, BookRecommendation, Category
} from '@/types';

const BASE = '/api';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Books ──────────────────────────────────────────────────────────────────
export const booksApi = {
  list: (filters: Partial<SearchFilters> & { page?: number; per_page?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) params.append(k, v.join(','));
        else params.append(k, String(v));
      }
    });
    return fetcher<PaginatedResponse<BookListing>>(`${BASE}/books?${params}`);
  },
  get: (id: string) => fetcher<BookListing>(`${BASE}/books/${id}`),
  create: (data: Partial<BookListing>) =>
    fetcher<BookListing>(`${BASE}/books`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<BookListing>) =>
    fetcher<BookListing>(`${BASE}/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetcher<{ success: boolean }>(`${BASE}/books/${id}`, { method: 'DELETE' }),
  myListings: () => fetcher<BookListing[]>(`${BASE}/books/my`),
};

// ── Categories ─────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => fetcher<Category[]>(`${BASE}/categories`),
  create: (data: Partial<Category>) =>
    fetcher<Category>(`${BASE}/categories`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Category>) =>
    fetcher<Category>(`${BASE}/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetcher<{ success: boolean }>(`${BASE}/categories/${id}`, { method: 'DELETE' }),
};

// ── Requests ───────────────────────────────────────────────────────────────
export const requestsApi = {
  create: (data: { listing_id: string; offer_listing_id?: string; message?: string }) =>
    fetcher<BookRequest>(`${BASE}/requests`, { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: 'accepted' | 'rejected') =>
    fetcher<BookRequest>(`${BASE}/requests/${id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
  incoming: () => fetcher<BookRequest[]>(`${BASE}/requests/incoming`),
  outgoing: () => fetcher<BookRequest[]>(`${BASE}/requests/outgoing`),
};

// ── Wishlist ───────────────────────────────────────────────────────────────
export const wishlistApi = {
  list: () => fetcher<WishlistItem[]>(`${BASE}/wishlist`),
  add: (listing_id: string) =>
    fetcher<WishlistItem>(`${BASE}/wishlist`, { method: 'POST', body: JSON.stringify({ listing_id }) }),
  remove: (listing_id: string) =>
    fetcher<{ success: boolean }>(`${BASE}/wishlist/${listing_id}`, { method: 'DELETE' }),
};

// ── Transactions ───────────────────────────────────────────────────────────
export const transactionsApi = {
  list: () => fetcher<Transaction[]>(`${BASE}/transactions`),
};

// ── AI ─────────────────────────────────────────────────────────────────────
export const aiApi = {
  summarize: (listingId: string) =>
    fetcher<AIBookSummary>(`${BASE}/ai/summarize`, {
      method: 'POST', body: JSON.stringify({ listing_id: listingId }),
    }),
  tts: (listingId: string) =>
    fetcher<{ audio_url: string }>(`${BASE}/ai/tts`, {
      method: 'POST', body: JSON.stringify({ listing_id: listingId }),
    }),
  recommend: (listingId?: string) =>
    fetcher<BookRecommendation[]>(`${BASE}/ai/recommend`, {
      method: 'POST', body: JSON.stringify({ listing_id: listingId }),
    }),
  lookupISBN: (isbn: string) =>
    fetcher<Partial<BookListing>>(`${BASE}/ai/isbn?isbn=${isbn}`),
  chat: (listingId: string, message: string) =>
    fetcher<{ response: string }>(`${BASE}/ai/chat`, {
      method: 'POST', body: JSON.stringify({ listing_id: listingId, message }),
    }),
};

// ── Upload ─────────────────────────────────────────────────────────────────
export const uploadApi = {
  bookImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/upload/image`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const { url } = await res.json();
    return url;
  },
};
