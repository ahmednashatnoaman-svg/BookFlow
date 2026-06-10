-- ============================================================
-- BookFlow — Missing Modules (v005)
-- Adds: book_images, request_events, moderation_logs,
--       transaction_events, rbac_permissions, analytics views,
--       exchange validation, enhanced reports, RBAC helpers
-- ============================================================

-- ── 1. BOOK IMAGE MODULE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES public.book_listings(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  sort_order   INT NOT NULL DEFAULT 0,
  width        INT,
  height       INT,
  size_bytes   INT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_book_images_listing ON public.book_images(listing_id);
CREATE INDEX idx_book_images_primary ON public.book_images(listing_id, is_primary);

-- Ensure only one primary image per listing
CREATE UNIQUE INDEX idx_book_images_one_primary
  ON public.book_images(listing_id)
  WHERE is_primary = true;

-- Function: set primary image (clears others first)
CREATE OR REPLACE FUNCTION public.set_primary_image(p_image_id UUID, p_listing_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify caller owns listing
  IF NOT EXISTS (
    SELECT 1 FROM public.book_listings
    WHERE id = p_listing_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.book_images SET is_primary = false WHERE listing_id = p_listing_id;
  UPDATE public.book_images SET is_primary = true  WHERE id = p_image_id AND listing_id = p_listing_id;

  -- Sync cover_image on listing
  UPDATE public.book_listings bl
    SET cover_image = bi.url
  FROM public.book_images bi
  WHERE bi.id = p_image_id AND bl.id = p_listing_id;
END;
$$;

-- Function: delete image + remove from storage path tracking
CREATE OR REPLACE FUNCTION public.delete_book_image(p_image_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_path TEXT;
  v_listing_id UUID;
  v_is_primary BOOLEAN;
BEGIN
  SELECT storage_path, listing_id, is_primary
    INTO v_path, v_listing_id, v_is_primary
    FROM public.book_images bi
    JOIN public.book_listings bl ON bl.id = bi.listing_id
   WHERE bi.id = p_image_id AND bl.user_id = auth.uid();

  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized or not found'; END IF;

  DELETE FROM public.book_images WHERE id = p_image_id;

  -- If was primary, promote next image
  IF v_is_primary THEN
    UPDATE public.book_images
      SET is_primary = true
    WHERE listing_id = v_listing_id
      AND id = (SELECT id FROM public.book_images WHERE listing_id = v_listing_id ORDER BY sort_order LIMIT 1);

    UPDATE public.book_listings bl
      SET cover_image = bi.url
    FROM public.book_images bi
    WHERE bi.listing_id = v_listing_id AND bi.is_primary = true AND bl.id = v_listing_id;
  END IF;

  RETURN v_path; -- caller uses this to delete from storage
END;
$$;


-- ── 2. REQUEST MANAGEMENT MODULE ────────────────────────────
-- request_events: audit trail for every status transition
CREATE TABLE IF NOT EXISTS public.request_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES public.book_requests(id) ON DELETE CASCADE,
  actor_id     UUID NOT NULL REFERENCES public.user_profiles(id),
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  note         TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_request_events_request ON public.request_events(request_id);
CREATE INDEX idx_request_events_actor   ON public.request_events(actor_id);

-- Trigger: auto-log request status changes
CREATE OR REPLACE FUNCTION public.log_request_event()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO public.request_events (request_id, actor_id, from_status, to_status)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.requester_id), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER request_event_logger
  AFTER UPDATE ON public.book_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_request_event();


-- ── 3. EXCHANGE MODULE ───────────────────────────────────────
-- Validate exchange: requester must own an offer_listing
CREATE OR REPLACE FUNCTION public.validate_exchange_offer(
  p_request_id UUID,
  p_offer_listing_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_offer public.book_listings%ROWTYPE;
BEGIN
  SELECT * INTO v_offer FROM public.book_listings
   WHERE id = p_offer_listing_id AND user_id = auth.uid() AND status = 'available';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You must own an available book to offer for exchange');
  END IF;

  UPDATE public.book_requests
    SET offer_listing_id = p_offer_listing_id
  WHERE id = p_request_id AND requester_id = auth.uid();

  RETURN jsonb_build_object('valid', true, 'offer_listing_id', p_offer_listing_id);
END;
$$;

-- Complete exchange: marks both books as exchanged
CREATE OR REPLACE FUNCTION public.complete_exchange(p_transaction_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_req public.book_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;

  -- Only seller can confirm completion
  IF v_tx.seller_id != auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_req FROM public.book_requests WHERE id = v_tx.request_id;

  -- Mark offer listing as exchanged too
  IF v_req.offer_listing_id IS NOT NULL THEN
    UPDATE public.book_listings SET status = 'exchanged' WHERE id = v_req.offer_listing_id;
  END IF;

  -- Record transaction event
  INSERT INTO public.transaction_events (transaction_id, actor_id, event_type, metadata)
  VALUES (p_transaction_id, auth.uid(), 'completed', '{}');

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── 4. TRANSACTION MODULE ────────────────────────────────────
-- transaction_events: full audit trail
CREATE TABLE IF NOT EXISTS public.transaction_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  actor_id       UUID NOT NULL REFERENCES public.user_profiles(id),
  event_type     TEXT NOT NULL CHECK (event_type IN ('initiated','confirmed','completed','disputed','refunded','cancelled')),
  metadata       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tx_events_transaction ON public.transaction_events(transaction_id);

-- Auto-log transaction creation
CREATE OR REPLACE FUNCTION public.log_transaction_created()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.transaction_events (transaction_id, actor_id, event_type)
  VALUES (NEW.id, NEW.seller_id, 'initiated');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER transaction_created_logger
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_transaction_created();

-- Get full transaction history for user (with roles)
CREATE OR REPLACE FUNCTION public.get_user_transactions(
  p_user_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, listing_id UUID, seller_id UUID, buyer_id UUID,
  type TEXT, completed_at TIMESTAMPTZ,
  role TEXT, listing_title TEXT, listing_cover TEXT,
  other_party_name TEXT, other_party_avatar TEXT,
  total_count BIGINT
) LANGUAGE plpgsql AS $$
DECLARE
  v_uid UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.listing_id, t.seller_id, t.buyer_id,
    t.type, t.completed_at,
    CASE WHEN t.seller_id = v_uid THEN 'seller' ELSE 'buyer' END AS role,
    bl.title, bl.cover_image,
    CASE WHEN t.seller_id = v_uid THEN buyer.full_name ELSE seller.full_name END,
    CASE WHEN t.seller_id = v_uid THEN buyer.avatar_url ELSE seller.avatar_url END,
    COUNT(*) OVER()
  FROM public.transactions t
  JOIN public.book_listings bl ON bl.id = t.listing_id
  JOIN public.user_profiles seller ON seller.id = t.seller_id
  JOIN public.user_profiles buyer ON buyer.id = t.buyer_id
  WHERE t.seller_id = v_uid OR t.buyer_id = v_uid
  ORDER BY t.completed_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


-- ── 5. NOTIFICATION MODULE ───────────────────────────────────
-- Extend notification types
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'request_received', 'request_accepted', 'request_rejected',
      'wishlist_available', 'exchange_completed', 'listing_reported',
      'account_suspended', 'listing_removed', 'new_message', 'system'
    )
  );

-- Mark all notifications read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.notifications SET read = true
  WHERE user_id = auth.uid() AND read = false;
END;
$$;

-- Get unread count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid() AND read = false;
  RETURN v_count;
END;
$$;


-- ── 6. MODERATION MODULE ─────────────────────────────────────
-- moderation_logs: admin action audit trail
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES public.user_profiles(id),
  action       TEXT NOT NULL CHECK (action IN (
                 'listing_removed','listing_restored','user_suspended',
                 'user_unsuspended','report_resolved','report_dismissed',
                 'listing_featured','listing_unfeatured'
               )),
  target_type  TEXT NOT NULL CHECK (target_type IN ('listing','user','report')),
  target_id    UUID NOT NULL,
  reason       TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mod_logs_admin  ON public.moderation_logs(admin_id);
CREATE INDEX idx_mod_logs_target ON public.moderation_logs(target_type, target_id);

-- Enhance reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Admin: resolve report
CREATE OR REPLACE FUNCTION public.resolve_report(
  p_report_id UUID,
  p_action TEXT,  -- 'resolve' or 'dismiss'
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_report public.reports%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM public.user_profiles WHERE id = auth.uid();

  IF NOT v_is_admin THEN RAISE EXCEPTION 'Admin access required'; END IF;

  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;

  UPDATE public.reports
    SET status = CASE p_action WHEN 'resolve' THEN 'resolved' ELSE 'dismissed' END,
        admin_id = auth.uid(),
        admin_note = p_note,
        resolved_at = now()
  WHERE id = p_report_id;

  -- Log moderation action
  INSERT INTO public.moderation_logs (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'report_resolved', 'report', p_report_id, p_note);

  RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

-- Admin: suspend user
CREATE OR REPLACE FUNCTION public.suspend_user(
  p_user_id UUID,
  p_reason TEXT,
  p_suspend BOOLEAN DEFAULT true
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM public.user_profiles WHERE id = auth.uid();

  IF NOT v_is_admin THEN RAISE EXCEPTION 'Admin access required'; END IF;

  -- Add suspended_at column if not exists (idempotent)
  UPDATE public.user_profiles
    SET role = CASE WHEN p_suspend THEN 'suspended' ELSE 'user' END
  WHERE id = p_user_id AND id != auth.uid();

  INSERT INTO public.moderation_logs (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(),
    CASE WHEN p_suspend THEN 'user_suspended' ELSE 'user_unsuspended' END,
    'user', p_user_id, p_reason);

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id,
    CASE WHEN p_suspend THEN 'account_suspended' ELSE 'system' END,
    CASE WHEN p_suspend THEN 'Account Suspended' ELSE 'Account Reinstated' END,
    CASE WHEN p_suspend THEN 'Your account has been suspended: ' || p_reason
         ELSE 'Your account has been reinstated.' END,
    jsonb_build_object('reason', p_reason));

  RETURN jsonb_build_object('success', true, 'suspended', p_suspend);
END;
$$;

-- Admin: remove listing
CREATE OR REPLACE FUNCTION public.admin_remove_listing(
  p_listing_id UUID,
  p_reason TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_listing public.book_listings%ROWTYPE;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM public.user_profiles WHERE id = auth.uid();

  IF NOT v_is_admin THEN RAISE EXCEPTION 'Admin access required'; END IF;

  SELECT * INTO v_listing FROM public.book_listings WHERE id = p_listing_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;

  UPDATE public.book_listings SET status = 'unavailable' WHERE id = p_listing_id;

  INSERT INTO public.moderation_logs (admin_id, action, target_type, target_id, reason)
  VALUES (auth.uid(), 'listing_removed', 'listing', p_listing_id, p_reason);

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (v_listing.user_id, 'listing_removed',
    'Listing Removed',
    'Your listing "' || v_listing.title || '" has been removed: ' || p_reason,
    jsonb_build_object('listing_id', p_listing_id, 'reason', p_reason));

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── 7. ANALYTICS MODULE ─────────────────────────────────────
-- Drop and recreate admin_stats with more metrics
DROP VIEW IF EXISTS public.admin_stats;

CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.book_listings)                       AS total_listings,
  (SELECT COUNT(*) FROM public.book_listings WHERE status='available') AS active_listings,
  (SELECT COUNT(*) FROM public.user_profiles WHERE role='user')     AS total_users,
  (SELECT COUNT(DISTINCT user_id) FROM public.book_listings
   WHERE created_at > now() - interval '30 days')                   AS active_users_30d,
  (SELECT COUNT(*) FROM public.transactions WHERE type='exchange')  AS total_exchanges,
  (SELECT COUNT(*) FROM public.transactions WHERE type='sale')      AS total_sales,
  (SELECT COUNT(*) FROM public.book_requests WHERE status='pending') AS pending_requests,
  (SELECT COUNT(*) FROM public.reports WHERE status='pending')      AS open_reports,
  (SELECT COUNT(*) FROM public.notifications WHERE read=false)      AS unread_notifications,
  (SELECT COUNT(*) FROM public.book_listings
   WHERE created_at > now() - interval '7 days')                    AS new_listings_7d,
  (SELECT COUNT(*) FROM public.user_profiles
   WHERE created_at > now() - interval '7 days')                    AS new_users_7d;

-- Growth data function (daily for last N days)
CREATE OR REPLACE FUNCTION public.get_growth_data(p_days INT DEFAULT 30)
RETURNS TABLE (
  date DATE,
  new_listings BIGINT,
  new_users BIGINT,
  completed_transactions BIGINT
) LANGUAGE sql AS $$
  SELECT
    d::DATE,
    COUNT(DISTINCT bl.id),
    COUNT(DISTINCT up.id),
    COUNT(DISTINCT tx.id)
  FROM generate_series(
    CURRENT_DATE - (p_days - 1) * INTERVAL '1 day',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) d
  LEFT JOIN public.book_listings bl ON bl.created_at::DATE = d::DATE
  LEFT JOIN public.user_profiles up ON up.created_at::DATE = d::DATE
  LEFT JOIN public.transactions tx  ON tx.completed_at::DATE = d::DATE
  GROUP BY d ORDER BY d;
$$;

-- Category breakdown with listing counts
CREATE OR REPLACE FUNCTION public.get_category_stats()
RETURNS TABLE (
  category_id UUID,
  name_en TEXT,
  name_ar TEXT,
  icon TEXT,
  listing_count BIGINT,
  available_count BIGINT,
  exchange_count BIGINT,
  sale_count BIGINT
) LANGUAGE sql AS $$
  SELECT
    c.id, c.name_en, c.name_ar, c.icon,
    COUNT(bl.id),
    COUNT(bl.id) FILTER (WHERE bl.status = 'available'),
    COUNT(bl.id) FILTER (WHERE bl.listing_type = 'exchange'),
    COUNT(bl.id) FILTER (WHERE bl.listing_type = 'sale')
  FROM public.categories c
  LEFT JOIN public.book_listings bl ON bl.category_id = c.id
  GROUP BY c.id ORDER BY COUNT(bl.id) DESC;
$$;

-- Top requested books
CREATE OR REPLACE FUNCTION public.get_top_requested_books(p_limit INT DEFAULT 10)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  author TEXT,
  cover_image TEXT,
  request_count BIGINT,
  wishlist_count BIGINT
) LANGUAGE sql AS $$
  SELECT
    bl.id, bl.title, bl.author, bl.cover_image,
    COUNT(DISTINCT br.id) AS request_count,
    COUNT(DISTINCT w.id)  AS wishlist_count
  FROM public.book_listings bl
  LEFT JOIN public.book_requests br ON br.listing_id = bl.id
  LEFT JOIN public.wishlist w        ON w.listing_id = bl.id
  WHERE bl.status = 'available'
  GROUP BY bl.id
  ORDER BY request_count DESC, wishlist_count DESC
  LIMIT p_limit;
$$;


-- ── 8. RBAC MODULE ───────────────────────────────────────────
-- Add suspended to role check
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
    CHECK (role IN ('user','admin','suspended'));

-- Permissions table (fine-grained RBAC)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role       TEXT NOT NULL CHECK (role IN ('user','admin','suspended')),
  resource   TEXT NOT NULL,  -- e.g. 'listings', 'users', 'categories', 'reports'
  action     TEXT NOT NULL,  -- e.g. 'create', 'read', 'update', 'delete', 'manage'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, resource, action)
);

-- Seed default permissions
INSERT INTO public.role_permissions (role, resource, action) VALUES
  -- User permissions
  ('user', 'listings',     'create'),
  ('user', 'listings',     'read'),
  ('user', 'listings',     'update'),   -- own listings only (enforced by RLS)
  ('user', 'listings',     'delete'),   -- own listings only
  ('user', 'requests',     'create'),
  ('user', 'requests',     'read'),
  ('user', 'requests',     'update'),   -- own requests only
  ('user', 'wishlist',     'create'),
  ('user', 'wishlist',     'read'),
  ('user', 'wishlist',     'delete'),
  ('user', 'transactions', 'read'),
  ('user', 'notifications','read'),
  ('user', 'notifications','update'),
  ('user', 'reports',      'create'),
  ('user', 'profile',      'update'),
  -- Admin permissions (all of the above + admin-only)
  ('admin', 'listings',     'manage'),
  ('admin', 'users',        'manage'),
  ('admin', 'categories',   'manage'),
  ('admin', 'reports',      'manage'),
  ('admin', 'moderation',   'manage'),
  ('admin', 'analytics',    'read'),
  -- Suspended: read-only
  ('suspended', 'listings', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- Helper: check if current user has permission
CREATE OR REPLACE FUNCTION public.has_permission(p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.user_profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = v_role AND resource = p_resource
      AND (action = p_action OR action = 'manage')
  );
END;
$$;

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ── 9. WISHLIST AVAILABILITY ALERTS ─────────────────────────
-- Already handled by notify_wishlist_on_relist trigger
-- Add function: batch-check wishlist status
CREATE OR REPLACE FUNCTION public.get_wishlist_with_status(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  wishlist_id UUID,
  listing_id UUID,
  title TEXT,
  author TEXT,
  cover_image TEXT,
  status TEXT,
  price NUMERIC,
  listing_type TEXT,
  added_at TIMESTAMPTZ,
  is_available BOOLEAN
) LANGUAGE sql AS $$
  SELECT
    w.id, bl.id, bl.title, bl.author, bl.cover_image,
    bl.status, bl.price, bl.listing_type, w.created_at,
    bl.status = 'available'
  FROM public.wishlist w
  JOIN public.book_listings bl ON bl.id = w.listing_id
  WHERE w.user_id = COALESCE(p_user_id, auth.uid())
  ORDER BY w.created_at DESC;
$$;


-- ── 10. CATEGORY MODULE ENHANCEMENTS ─────────────────────────
-- Add description + active flag to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Active categories only view
CREATE OR REPLACE VIEW public.active_categories AS
  SELECT c.*, COUNT(bl.id) AS listing_count
  FROM public.categories c
  LEFT JOIN public.book_listings bl
    ON bl.category_id = c.id AND bl.status = 'available'
  WHERE c.is_active = true
  GROUP BY c.id
  ORDER BY c.sort_order;


-- ── COMPOSITE INDEXES FOR PERFORMANCE ────────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_status_type
  ON public.book_listings(status, listing_type);

CREATE INDEX IF NOT EXISTS idx_listings_city_status
  ON public.book_listings(city, status);

CREATE INDEX IF NOT EXISTS idx_requests_listing_status
  ON public.book_requests(listing_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mod_logs_created
  ON public.moderation_logs(created_at DESC);
