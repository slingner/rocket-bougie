create table seasonal_banners (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_month smallint not null,
  start_day   smallint not null,
  end_month   smallint not null,
  end_day     smallint not null,
  priority    smallint not null default 0,

  -- Hero section overrides (all optional — falls back to default hero)
  hero_image_url text,
  hero_headline  text,
  hero_subtext   text,
  hero_cta_label text,
  hero_cta_url   text,

  -- Feature section (appears between Collections and New Arrivals)
  feature_headline  text,
  feature_subtext   text,
  feature_image_url text,
  feature_cta_label text,
  feature_cta_url   text,

  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table seasonal_banners enable row level security;

create policy "Anyone can read seasonal banners"
  on seasonal_banners for select using (true);

-- Pre-seed with US holidays/seasons
-- Images reference specific products from the catalog
insert into seasonal_banners
  (name, start_month, start_day, end_month, end_day, priority,
   hero_headline, hero_subtext, hero_cta_label, hero_cta_url,
   feature_headline, feature_subtext, feature_image_url, feature_cta_label, feature_cta_url)
values
  ('Valentine''s Day', 2, 1, 2, 14, 10,
   'Love is in the details.',
   'Handpainted cards, prints, and stickers made for gifting with heart.',
   'Shop Gift Ideas', '/shop',
   'Made with love, for the ones you love.',
   'From tiny stickers to wall-worthy prints — find something that says it perfectly.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/0ed6cf99-9dac-4ba0-817e-7fe79f30b25b/1.jpg',
   'Shop Gift Ideas', '/shop'),

  ('Spring', 3, 15, 5, 31, 5,
   'Fresh starts and new colors.',
   'Spring has arrived in our studio — new prints, florals, and everything in bloom.',
   'Shop Spring', '/shop',
   'The world is waking up.',
   'New watercolors inspired by California''s golden hills and Pacific blooms.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/94bec10d-da55-46cb-9dae-148fc8814589/1773020615390-26alffztlzp.png',
   'Explore the Collection', '/shop?collection=california'),

  ('Mother''s Day', 5, 1, 5, 14, 8,
   'For the mom who deserves something handmade.',
   'Watercolor cards and prints made with love — just like she raised you.',
   'Shop Mother''s Day', '/shop',
   'She''ll love something made by hand.',
   'From heartfelt cards to wall-worthy prints, find the perfect gift for mom.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/640ae1dc-a5e8-4460-89a7-610ab6375b63/1.jpg',
   'Shop Mother''s Day Gifts', '/shop'),

  ('Summer', 6, 1, 8, 31, 5,
   'Sun, sea, and a whole lot of color.',
   'Summer in a sticker, a print, a card. Pack it up.',
   'Shop Summer', '/shop',
   'Golden hour, every hour.',
   'Our sunniest watercolors — ocean blues, sandy tones, and California skies.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/79c60e08-f3c4-47e0-9028-01ee1832eecc/1773019333297-asnyfvmrv7n.png',
   'Shop Summer Picks', '/shop?collection=ocean'),

  ('Halloween', 10, 1, 10, 31, 8,
   'A little spooky. A lot cute.',
   'Trick or treat yourself to something handpainted this October.',
   'Shop Halloween', '/shop',
   'Boo — from our studio to yours.',
   'Spooky-cute prints, stickers, and cards that keep Halloween sweet.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/e6e4caaa-c0b4-4344-9fe5-4727983a7c25/1.png',
   'Shop Halloween', '/shop'),

  ('Thanksgiving', 11, 1, 11, 28, 9,
   'Give thanks with something handmade.',
   'Watercolor cards and prints to share a little warmth this season.',
   'Shop Thanksgiving', '/shop',
   'Thankful for the little things.',
   'Handpainted cards and prints that capture the warmth of the season.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/94f5297e-3c55-4c5c-834a-9d676920c959/1773020577444-frvhc5npmcm.png',
   'Shop Thanksgiving Picks', '/shop'),

  ('Christmas', 11, 29, 12, 26, 10,
   'The gift of something handmade.',
   'Watercolor prints, cards, and stickers that wrap up beautifully.',
   'Shop Holiday Gifts', '/shop',
   'Wrapped up in joy.',
   'Give art this season — prints, cards, and stickers from our studio, ready to gift.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/1b401340-b91a-4556-b8e5-b2efe74f812c/1772956750672-s72zjm5ektg.png',
   'Shop Holiday Gift Guide', '/shop'),

  ('New Year', 12, 27, 1, 10, 7,
   'Here''s to a colorful year ahead.',
   'Start the year with something handmade and full of heart.',
   'Shop New Arrivals', '/shop',
   'Fresh year, fresh walls.',
   'New prints and a new year — the perfect excuse to redecorate.',
   'https://blrwnsdqucoudycjkjfq.supabase.co/storage/v1/object/public/product-images/products/d043f6b5-2e6d-456b-a73b-7030621c40e1/1772944177703-eunb0xnyoz8.png',
   'Shop New Year Picks', '/shop?collection=space');
