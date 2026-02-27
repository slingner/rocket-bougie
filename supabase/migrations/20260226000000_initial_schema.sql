-- ============================================================
-- Rocket Boogie — Initial Schema
-- ============================================================

-- ---- Products -----------------------------------------------

create table products (
  id                  uuid primary key default gen_random_uuid(),
  handle              text not null unique,       -- used for URLs, matches Shopify handle
  title               text not null,
  description         text,                       -- HTML from Shopify
  vendor              text not null default 'Rocket Boogie Co.',
  product_type        text,                       -- e.g. 'Paper products', 'Bags', 'Home Decor'
  tags                text[] default '{}',        -- e.g. '{California, individual-sticker}'
  published           boolean not null default true,
  fulfillment_service text not null default 'manual',  -- 'manual' | 'printify' | 'gift_card'
  seo_title           text,
  seo_description     text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ---- Product variants ----------------------------------------
-- Every product has at least one variant.
-- Single-option products (most stickers, cards) have one row with option1_name = 'Title', option1_value = 'Default Title'.
-- Multi-option products (prints, tote bags) have one row per combination.

create table product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products(id) on delete cascade,
  sku                 text,
  option1_name        text,                       -- e.g. 'Size', 'Color', 'Denominations', 'Title'
  option1_value       text,                       -- e.g. '8x10', 'Natural', '$10.00', 'Default Title'
  option2_name        text,                       -- e.g. 'Size' (for tote bags)
  option2_value       text,                       -- e.g. '15" x 16"'
  option3_name        text,
  option3_value       text,
  price               numeric(10,2) not null,
  compare_at_price    numeric(10,2),
  inventory_quantity  int not null default 0,
  inventory_policy    text not null default 'deny',  -- 'deny' (stop at 0) | 'continue' (allow oversell)
  requires_shipping   boolean default true,
  taxable             boolean default true,
  weight_value        numeric(10,4),
  weight_unit         text default 'lb',
  variant_image_url   text,                       -- variant-specific image (used on tote bags)
  printify_variant_id text,                       -- Printify internal ID for POD products
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ---- Product images ------------------------------------------

create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  position    int not null default 1,
  alt_text    text,
  created_at  timestamptz default now()
);

-- ---- Collections ---------------------------------------------

create table collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- Product ↔ Collection junction
create table product_collections (
  product_id    uuid not null references products(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  sort_order    int default 0,
  primary key (product_id, collection_id)
);

-- ---- Customers -----------------------------------------------
-- Extends Supabase auth.users — one row per registered user.

create table customers (
  id                 uuid primary key references auth.users(id) on delete cascade,
  first_name         text,
  last_name          text,
  email              text not null,
  phone              text,
  accepts_marketing  boolean default false,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ---- Addresses -----------------------------------------------

create table addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  first_name  text,
  last_name   text,
  address1    text not null,
  address2    text,
  city        text not null,
  state       text,
  zip         text not null,
  country     text not null default 'US',
  phone       text,
  is_default  boolean default false,
  created_at  timestamptz default now()
);

-- ---- Orders --------------------------------------------------

create table orders (
  id                          uuid primary key default gen_random_uuid(),
  order_number                int generated always as identity,
  customer_id                 uuid references customers(id),
  email                       text not null,         -- stored for guest checkout too
  status                      text not null default 'pending',
    -- pending | paid | fulfilled | refunded | cancelled
  fulfillment_status          text default 'unfulfilled',
    -- unfulfilled | fulfilled | partial

  -- Stripe
  stripe_payment_intent_id    text unique,
  stripe_checkout_session_id  text unique,

  -- Totals
  subtotal                    numeric(10,2) not null,
  shipping_total              numeric(10,2) not null default 0,
  tax_total                   numeric(10,2) not null default 0,
  total                       numeric(10,2) not null,

  -- Shipping address snapshot
  shipping_name               text,
  shipping_address1           text,
  shipping_address2           text,
  shipping_city               text,
  shipping_state              text,
  shipping_zip                text,
  shipping_country            text default 'US',

  -- Fulfillment
  tracking_number             text,
  tracking_url                text,

  note                        text,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- ---- Order items ---------------------------------------------

create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  product_id     uuid references products(id),          -- nullable: product may be deleted later
  variant_id     uuid references product_variants(id),
  title          text not null,                         -- product title snapshot
  variant_title  text,                                  -- e.g. '8x10', 'Natural / 15" x 16"'
  quantity       int not null,
  unit_price     numeric(10,2) not null,
  total_price    numeric(10,2) not null,
  image_url      text,
  created_at     timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index on product_variants (product_id);
create index on product_images (product_id, position);
create index on product_collections (collection_id);
create index on orders (customer_id);
create index on orders (status);
create index on order_items (order_id);
create index on customers (email);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table products           enable row level security;
alter table product_variants   enable row level security;
alter table product_images     enable row level security;
alter table collections        enable row level security;
alter table product_collections enable row level security;
alter table customers          enable row level security;
alter table addresses          enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;

-- Products, variants, images, collections — public read
create policy "Public can read products"
  on products for select using (published = true);

create policy "Public can read variants"
  on product_variants for select using (true);

create policy "Public can read images"
  on product_images for select using (true);

create policy "Public can read collections"
  on collections for select using (true);

create policy "Public can read product_collections"
  on product_collections for select using (true);

-- Customers — can only see/edit their own row
create policy "Customers can read own profile"
  on customers for select using (auth.uid() = id);

create policy "Customers can update own profile"
  on customers for update using (auth.uid() = id);

create policy "Customers can insert own profile"
  on customers for insert with check (auth.uid() = id);

-- Addresses — tied to customer
create policy "Customers can manage own addresses"
  on addresses for all using (auth.uid() = customer_id);

-- Orders — customers can see their own orders
create policy "Customers can read own orders"
  on orders for select using (auth.uid() = customer_id);

-- Order items — customers can see items on their own orders
create policy "Customers can read own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.customer_id = auth.uid()
    )
  );
