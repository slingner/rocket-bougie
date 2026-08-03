-- Add Etsy listing ID to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS etsy_listing_id TEXT;

-- App settings table for storing OAuth tokens and other key-value config
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS on app_settings — accessed only via admin client (service role)
