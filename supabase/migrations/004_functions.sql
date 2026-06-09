-- ============================================================
-- BookFlow — Helper Functions & Triggers
-- ============================================================

-- ── Accept request → auto-reject others + create transaction ─
CREATE OR REPLACE FUNCTION public.accept_request(p_request_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_request  public.book_requests%ROWTYPE;
  v_listing  public.book_listings%ROWTYPE;
  v_tx_id    UUID;
BEGIN
  SELECT * INTO v_request FROM public.book_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;

  SELECT * INTO v_listing FROM public.book_listings WHERE id = v_request.listing_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;

  -- only listing owner can accept
  IF v_listing.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- accept this request
  UPDATE public.book_requests SET status = 'accepted' WHERE id = p_request_id;

  -- reject all others for same listing
  UPDATE public.book_requests
    SET status = 'rejected'
  WHERE listing_id = v_request.listing_id
    AND id != p_request_id
    AND status = 'pending';

  -- mark listing as sold/exchanged
  UPDATE public.book_listings
    SET status = CASE v_listing.listing_type WHEN 'sale' THEN 'sold' ELSE 'exchanged' END
  WHERE id = v_listing.id;

  -- create transaction record
  INSERT INTO public.transactions (listing_id, seller_id, buyer_id, request_id, type)
  VALUES (v_listing.id, v_listing.user_id, v_request.requester_id, p_request_id, v_listing.listing_type)
  RETURNING id INTO v_tx_id;

  -- notify requester
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    v_request.requester_id, 'request_accepted',
    'Request Accepted!',
    'Your request for "' || v_listing.title || '" has been accepted.',
    jsonb_build_object('listing_id', v_listing.id, 'request_id', p_request_id)
  );

  -- notify rejected requesters
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT r.requester_id, 'request_rejected',
         'Request Not Available',
         '"' || v_listing.title || '" is no longer available.',
         jsonb_build_object('listing_id', v_listing.id)
  FROM public.book_requests r
  WHERE r.listing_id = v_listing.id
    AND r.id != p_request_id
    AND r.status = 'rejected';

  RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id);
END;
$$;

-- ── Increment view count ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(p_listing_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.book_listings SET view_count = view_count + 1 WHERE id = p_listing_id;
END;
$$;

-- ── Wishlist availability notification ───────────────────────
CREATE OR REPLACE FUNCTION public.notify_wishlist_on_relist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'available' AND OLD.status != 'available' THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT w.user_id, 'wishlist_available',
           'Book Available Again',
           '"' || NEW.title || '" is available again!',
           jsonb_build_object('listing_id', NEW.id)
    FROM public.wishlist w WHERE w.listing_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER listing_relist_notify
  AFTER UPDATE ON public.book_listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_wishlist_on_relist();

-- ── Admin analytics view ──────────────────────────────────────
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.book_listings) AS total_listings,
  (SELECT COUNT(*) FROM public.book_listings WHERE status = 'available') AS active_listings,
  (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'user') AS total_users,
  (SELECT COUNT(DISTINCT user_id) FROM public.book_listings
   WHERE created_at > now() - interval '30 days') AS active_users_30d,
  (SELECT COUNT(*) FROM public.transactions WHERE type = 'exchange') AS total_exchanges,
  (SELECT COUNT(*) FROM public.transactions WHERE type = 'sale') AS total_sales;

-- ── Search function (full-text + filters) ────────────────────
CREATE OR REPLACE FUNCTION public.search_listings(
  p_query TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_condition TEXT[] DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'newest',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, author TEXT, category_id UUID,
  condition TEXT, listing_type TEXT, status TEXT,
  price NUMERIC, cover_image TEXT, city TEXT,
  language TEXT, view_count INT, created_at TIMESTAMPTZ,
  user_id UUID, total_count BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    bl.id, bl.title, bl.author, bl.category_id,
    bl.condition, bl.listing_type, bl.status,
    bl.price, bl.cover_image, bl.city,
    bl.language, bl.view_count, bl.created_at,
    bl.user_id,
    COUNT(*) OVER() AS total_count
  FROM public.book_listings bl
  WHERE bl.status = 'available'
    AND (p_query IS NULL OR bl.fts @@ plainto_tsquery('english', p_query))
    AND (p_category_id IS NULL OR bl.category_id = p_category_id)
    AND (p_condition IS NULL OR bl.condition = ANY(p_condition))
    AND (p_listing_type IS NULL OR bl.listing_type = p_listing_type)
    AND (p_min_price IS NULL OR bl.price >= p_min_price)
    AND (p_max_price IS NULL OR bl.price <= p_max_price)
    AND (p_city IS NULL OR bl.city ILIKE '%' || p_city || '%')
    AND (p_language IS NULL OR bl.language = p_language)
  ORDER BY
    CASE p_sort
      WHEN 'price_asc'  THEN bl.price
      WHEN 'price_desc' THEN -bl.price
      ELSE NULL
    END,
    CASE WHEN p_sort = 'newest' OR p_sort IS NULL THEN bl.created_at END DESC,
    CASE WHEN p_query IS NOT NULL THEN ts_rank(bl.fts, plainto_tsquery('english', p_query)) END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
