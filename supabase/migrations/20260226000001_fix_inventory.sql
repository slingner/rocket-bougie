-- All variants were imported with inventory_quantity = 0 and inventory_policy = 'deny'
-- because the Shopify product CSV doesn't include inventory counts.
-- Set policy to 'continue' (don't block on quantity) so nothing shows as sold out.
-- Individual variants can be flipped back to 'deny' + quantity 0 when something is actually sold out.
update product_variants set inventory_policy = 'continue';
