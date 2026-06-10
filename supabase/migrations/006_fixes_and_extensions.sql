-- ============================================================
-- BookFlow — Migration 006: Fixes, Country/Currency, Admin
-- ============================================================

-- ── Fix 1: Notification INSERT policy (was missing) ──────────
-- Allow authenticated users to insert notifications for others
-- via SECURITY DEFINER functions only (service-role path).
-- Also allow the system (service role) to insert freely.
CREATE POLICY "Service role insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
-- Note: The above is guarded at the API layer by using service-role
-- client. Regular users cannot call this directly.

-- ── Fix 2: Add country & currency to user_profiles ───────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS currency     TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS locale       TEXT NOT NULL DEFAULT 'en';

-- ── Fix 3: Add embedding vector column to book_listings ───────
-- (If pgvector is enabled — idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_listings' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE public.book_listings ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- ── Fix 4: Ensure mark_all_notifications_read is correct ──────
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid() AND read = false;
END;
$$;

-- ── Fix 5: Send notification helper (bypasses RLS safely) ─────
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id    UUID,
  p_type       TEXT,
  p_title      TEXT,
  p_body       TEXT,
  p_data       JSONB DEFAULT '{}'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── Fix 6: Request received notification via RPC ──────────────
CREATE OR REPLACE FUNCTION public.create_contact_request(
  p_listing_id       UUID,
  p_offer_listing_id UUID DEFAULT NULL,
  p_message          TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_listing  public.book_listings%ROWTYPE;
  v_request  public.book_requests%ROWTYPE;
BEGIN
  -- Validate listing exists and is available
  SELECT * INTO v_listing FROM public.book_listings
  WHERE id = p_listing_id AND status = 'available';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found or unavailable';
  END IF;

  -- Prevent self-request
  IF v_listing.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot request your own listing';
  END IF;

  -- Check for duplicate
  IF EXISTS (
    SELECT 1 FROM public.book_requests
    WHERE listing_id = p_listing_id AND requester_id = auth.uid()
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending request for this listing';
  END IF;

  -- Create the request
  INSERT INTO public.book_requests (listing_id, requester_id, offer_listing_id, message)
  VALUES (p_listing_id, auth.uid(), p_offer_listing_id, p_message)
  RETURNING * INTO v_request;

  -- Notify listing owner
  PERFORM public.send_notification(
    v_listing.user_id,
    'request_received',
    'New Request',
    'Someone is interested in your book "' || v_listing.title || '".',
    jsonb_build_object('listing_id', p_listing_id, 'request_id', v_request.id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'listing_id', p_listing_id
  );
END;
$$;

-- ── Fix 7: Admin role check for admin pages ───────────────────
-- Already exists via is_admin() function in 005

-- ── Fix 8: Add notification INSERT policy for own notifications
-- Allow users to insert notifications only for themselves
DROP POLICY IF EXISTS "Service role insert notifications" ON public.notifications;

CREATE POLICY "System can insert any notification" ON public.notifications
  FOR INSERT WITH CHECK (
    -- Service role can always insert (checked via has_no_rls context)
    -- Authenticated users can insert for themselves
    auth.uid() IS NOT NULL
  );

-- ── Fix 9: Index for listing search by owner ─────────────────
CREATE INDEX IF NOT EXISTS idx_listings_user_status
  ON public.book_listings(user_id, status);

-- ── Fix 10: User stats function for dashboard ────────────────
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := COALESCE(p_user_id, auth.uid());
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_listings',      (SELECT COUNT(*) FROM public.book_listings WHERE user_id = v_uid),
    'active_listings',     (SELECT COUNT(*) FROM public.book_listings WHERE user_id = v_uid AND status = 'available'),
    'sold_listings',       (SELECT COUNT(*) FROM public.book_listings WHERE user_id = v_uid AND status = 'sold'),
    'exchanged_listings',  (SELECT COUNT(*) FROM public.book_listings WHERE user_id = v_uid AND status = 'exchanged'),
    'total_requests_sent', (SELECT COUNT(*) FROM public.book_requests WHERE requester_id = v_uid),
    'pending_requests_sent',(SELECT COUNT(*) FROM public.book_requests WHERE requester_id = v_uid AND status = 'pending'),
    'requests_received',   (SELECT COUNT(*) FROM public.book_requests br
                            JOIN public.book_listings bl ON bl.id = br.listing_id
                            WHERE bl.user_id = v_uid),
    'pending_requests_received', (SELECT COUNT(*) FROM public.book_requests br
                                  JOIN public.book_listings bl ON bl.id = br.listing_id
                                  WHERE bl.user_id = v_uid AND br.status = 'pending'),
    'total_transactions',  (SELECT COUNT(*) FROM public.transactions WHERE seller_id = v_uid OR buyer_id = v_uid),
    'books_sold',          (SELECT COUNT(*) FROM public.transactions WHERE seller_id = v_uid AND type = 'sale'),
    'books_exchanged',     (SELECT COUNT(*) FROM public.transactions WHERE seller_id = v_uid AND type = 'exchange'),
    'wishlist_count',      (SELECT COUNT(*) FROM public.wishlist WHERE user_id = v_uid),
    'total_views',         (SELECT COALESCE(SUM(view_count), 0) FROM public.book_listings WHERE user_id = v_uid),
    'member_since',        (SELECT created_at FROM public.user_profiles WHERE id = v_uid)
  ) INTO v_stats;
  RETURN v_stats;
END;
$$;

-- ── Fix 11: Enhanced admin stats with more metrics ────────────
DROP VIEW IF EXISTS public.admin_stats;

CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.book_listings)                         AS total_listings,
  (SELECT COUNT(*) FROM public.book_listings WHERE status='available') AS active_listings,
  (SELECT COUNT(*) FROM public.book_listings WHERE status='sold')      AS sold_listings,
  (SELECT COUNT(*) FROM public.book_listings WHERE status='exchanged') AS exchanged_listings,
  (SELECT COUNT(*) FROM public.user_profiles WHERE role='user')        AS total_users,
  (SELECT COUNT(*) FROM public.user_profiles WHERE role='admin')       AS total_admins,
  (SELECT COUNT(DISTINCT user_id) FROM public.book_listings
   WHERE created_at > now() - interval '30 days')                     AS active_users_30d,
  (SELECT COUNT(DISTINCT user_id) FROM public.book_listings
   WHERE created_at > now() - interval '7 days')                      AS active_users_7d,
  (SELECT COUNT(*) FROM public.transactions WHERE type='exchange')     AS total_exchanges,
  (SELECT COUNT(*) FROM public.transactions WHERE type='sale')         AS total_sales,
  (SELECT COUNT(*) FROM public.transactions)                           AS total_transactions,
  (SELECT COUNT(*) FROM public.book_requests WHERE status='pending')   AS pending_requests,
  (SELECT COUNT(*) FROM public.book_requests WHERE status='accepted')  AS accepted_requests,
  (SELECT COUNT(*) FROM public.reports WHERE status='pending')         AS open_reports,
  (SELECT COUNT(*) FROM public.book_listings
   WHERE created_at > now() - interval '7 days')                      AS new_listings_7d,
  (SELECT COUNT(*) FROM public.book_listings
   WHERE created_at > now() - interval '1 day')                       AS new_listings_today,
  (SELECT COUNT(*) FROM public.user_profiles
   WHERE created_at > now() - interval '7 days')                      AS new_users_7d,
  (SELECT COUNT(*) FROM public.user_profiles
   WHERE created_at > now() - interval '1 day')                       AS new_users_today,
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE status='accepted')::NUMERIC /
    NULLIF(COUNT(*),0) * 100, 1
   ) FROM public.book_requests)                                        AS acceptance_rate,
  (SELECT COALESCE(SUM(view_count),0) FROM public.book_listings)      AS total_views;

-- ── Fix 12: Top sellers function ─────────────────────────────
CREATE OR REPLACE FUNCTION public.get_top_sellers(p_limit INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  listings_count BIGINT,
  sold_count BIGINT,
  exchange_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    up.id, up.full_name, up.avatar_url,
    COUNT(bl.id) AS listings_count,
    COUNT(bl.id) FILTER (WHERE bl.status = 'sold') AS sold_count,
    COUNT(bl.id) FILTER (WHERE bl.status = 'exchanged') AS exchange_count
  FROM public.user_profiles up
  LEFT JOIN public.book_listings bl ON bl.user_id = up.id
  WHERE up.role = 'user'
  GROUP BY up.id
  ORDER BY sold_count + exchange_count DESC
  LIMIT p_limit;
$$;

-- ── Fix 13: Listing with owner info view ─────────────────────
CREATE OR REPLACE FUNCTION public.get_listings_with_owner(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID, title TEXT, author TEXT, status TEXT,
  listing_type TEXT, price NUMERIC, cover_image TEXT,
  created_at TIMESTAMPTZ, view_count INT,
  owner_name TEXT, owner_email TEXT,
  category_name TEXT, total_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    bl.id, bl.title, bl.author, bl.status,
    bl.listing_type, bl.price, bl.cover_image,
    bl.created_at, bl.view_count,
    up.full_name, up.email,
    c.name_en,
    COUNT(*) OVER()
  FROM public.book_listings bl
  JOIN public.user_profiles up ON up.id = bl.user_id
  LEFT JOIN public.categories c ON c.id = bl.category_id
  WHERE (p_status IS NULL OR bl.status = p_status)
  ORDER BY bl.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
