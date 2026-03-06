-- Add wholesale and retail price fields to product_variants
-- wholesale_price = what Faire retailers pay
-- retail_price    = MSRP / recommended retail price (shown to end customers)
-- Both are optional; Faire draft falls back to 50% of price if not set.

alter table product_variants
  add column wholesale_price numeric(10,2),
  add column retail_price    numeric(10,2);
