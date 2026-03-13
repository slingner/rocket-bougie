-- Allow shop-level reviews (e.g. imported from Etsy) with no product association
ALTER TABLE reviews ALTER COLUMN product_id DROP NOT NULL;
