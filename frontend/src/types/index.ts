export type Locale = 'en' | 'ar';

export type BookCondition = 'new' | 'good' | 'acceptable' | 'poor';
export type ListingType = 'sale' | 'exchange';
export type ListingStatus = 'available' | 'sold' | 'exchanged' | 'unavailable';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  city: string | null;
  bio: string | null;
  created_at: string;
  listing_count?: number;
  exchange_count?: number;
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  icon: string;
  listing_count?: number;
}

export interface BookListing {
  id: string;
  user_id: string;
  title: string;
  author: string;
  isbn: string | null;
  category_id: string;
  category?: Category;
  condition: BookCondition;
  listing_type: ListingType;
  status: ListingStatus;
  price: number | null;
  currency: string;
  description: string | null;
  images: string[];
  cover_image: string | null;
  audio_url: string | null;
  ai_summary: string | null;
  publisher: string | null;
  published_year: number | null;
  language: string;
  city: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  owner?: UserProfile;
  is_wishlisted?: boolean;
  request_count?: number;
}

export interface BookRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  offer_listing_id: string | null;
  message: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  listing?: BookListing;
  requester?: UserProfile;
  offer_listing?: BookListing;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: BookListing;
}

export interface Transaction {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  request_id: string;
  type: ListingType;
  completed_at: string;
  listing?: BookListing;
  seller?: UserProfile;
  buyer?: UserProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'wishlist_available';
  title: string;
  body: string;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
}

export interface AIBookSummary {
  summary: string;
  key_themes: string[];
  target_audience: string;
  mood: string;
  similar_books: string[];
  reading_time_estimate: string;
}

export interface BookRecommendation {
  listing: BookListing;
  score: number;
  reason: string;
}

export interface SearchFilters {
  query: string;
  category_id?: string;
  condition?: BookCondition[];
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  city?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'most_relevant';
  language?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface AdminStats {
  total_listings: number;
  active_listings: number;
  total_users: number;
  active_users_30d: number;
  total_exchanges: number;
  total_sales: number;
  listings_by_category: { category: string; count: number }[];
  top_requested_books: { title: string; count: number }[];
  growth_data: { date: string; listings: number; users: number }[];
}
