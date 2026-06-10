-- Add currency column to book_listings (default EGP for Egyptian market)
ALTER TABLE book_listings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'EGP';
CREATE INDEX IF NOT EXISTS idx_book_listings_currency ON book_listings(currency);
COMMENT ON COLUMN book_listings.currency IS 'ISO 4217 currency code (EGP, USD, EUR, SAR, AED, GBP)';
