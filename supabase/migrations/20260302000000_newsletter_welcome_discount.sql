-- Add source column to discount_codes to distinguish auto-generated newsletter codes
alter table discount_codes
  add column if not exists source text not null default 'admin';

-- Link newsletter subscribers to their welcome discount code
alter table newsletter_subscribers
  add column if not exists welcome_discount_code_id uuid references discount_codes(id);
