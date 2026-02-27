-- Add Stripe Promotion Code ID to discount_codes.
-- Promotion Codes wrap Coupons and provide per-customer redemption tracking in Stripe.
alter table discount_codes
  add column if not exists stripe_promotion_code_id text;
