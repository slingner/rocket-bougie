-- Shipping profiles: define envelope size + rate tiers
create table shipping_profiles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  base_price    numeric(10,2) not null,
  additional_price numeric(10,2) not null,
  sort_order    int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table shipping_profiles enable row level security;

-- Admin-only via service role (no public access needed)
create policy "admin_all" on shipping_profiles
  using (true) with check (true);

-- Add FK to product_variants so each variant knows which shipping tier it uses
alter table product_variants
  add column shipping_profile_id uuid references shipping_profiles(id) on delete set null;

-- Seed the three default profiles
insert into shipping_profiles (name, description, base_price, additional_price, sort_order) values
  ('Sticker / Mini Print', 'Ships in 9×6×0.5" flat envelope (USPS First-Class)', 2.50, 0.50, 1),
  ('8×10 Print',           'Ships in 12×9×0.5" flat envelope (USPS First-Class)', 3.50, 0.50, 2),
  ('11×14 Print',          'Ships in 15×12.75×0.5" flat envelope (USPS First-Class)', 4.50, 0.25, 3);
