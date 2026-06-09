-- ============================================================
-- BookFlow — Row Level Security Policies
-- ============================================================

ALTER TABLE public.user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_listings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;

-- ── User Profiles ────────────────────────────────────────────
CREATE POLICY "Public read profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── Categories ───────────────────────────────────────────────
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Book Listings ─────────────────────────────────────────────
CREATE POLICY "Public read available listings" ON public.book_listings
  FOR SELECT USING (status = 'available' OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Auth users create listings" ON public.book_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own listings" ON public.book_listings
  FOR UPDATE USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Owners delete own listings" ON public.book_listings
  FOR DELETE USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Book Requests ─────────────────────────────────────────────
CREATE POLICY "Read own requests" ON public.book_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.book_listings WHERE id = listing_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Auth users create requests" ON public.book_requests
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND
    NOT EXISTS (
      SELECT 1 FROM public.book_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Listing owners update request status" ON public.book_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.book_listings WHERE id = listing_id AND user_id = auth.uid())
  );

-- ── Wishlist ──────────────────────────────────────────────────
CREATE POLICY "Users manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- ── Transactions ──────────────────────────────────────────────
CREATE POLICY "Read own transactions" ON public.transactions
  FOR SELECT USING (seller_id = auth.uid() OR buyer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Notifications ─────────────────────────────────────────────
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Reports ───────────────────────────────────────────────────
CREATE POLICY "Auth users create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins manage reports" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
