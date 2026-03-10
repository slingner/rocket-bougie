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

-- Pre-seed with common US holidays/seasons
insert into seasonal_banners
  (name, start_month, start_day, end_month, end_day, priority,
   hero_headline, hero_subtext, hero_cta_label, hero_cta_url,
   feature_headline, feature_subtext, feature_cta_label, feature_cta_url)
values
  ('Valentine''s Day', 2, 1, 2, 14, 10,
   'Love is in the details.',
   'Handpainted cards, prints, and stickers made for gifting with heart.',
   'Shop Gift Ideas', '/shop',
   'Made with love, for the ones you love.',
   'From tiny stickers to wall-worthy prints — find something that says it perfectly.',
   'Shop Gift Ideas', '/shop'),

  ('Spring', 3, 15, 5, 31, 5,
   'Fresh starts and new colors.',
   'Spring has arrived in our studio — new prints, florals, and everything in bloom.',
   'Shop Spring', '/shop',
   'The world is waking up.',
   'New watercolors inspired by California''s golden hills and Pacific blooms.',
   'Explore the Collection', '/shop'),

  ('Summer', 6, 1, 8, 31, 5,
   'Sun, sea, and a whole lot of color.',
   'Summer in a sticker, a print, a card. Pack it up.',
   'Shop Summer', '/shop',
   'Golden hour, every hour.',
   'Our sunniest watercolors — ocean blues, sandy tones, and California skies.',
   'Shop Summer Picks', '/shop'),

  ('Halloween', 10, 1, 10, 31, 8,
   'A little spooky. A lot cute.',
   'Trick or treat yourself to something handpainted this October.',
   'Shop Halloween', '/shop',
   'Boo — from our studio to yours.',
   'Spooky-cute prints, stickers, and cards that keep Halloween sweet.',
   'Shop Halloween', '/shop'),

  ('Thanksgiving', 11, 1, 11, 28, 9,
   'Give thanks with something handmade.',
   'Watercolor cards and prints to share a little warmth this season.',
   'Shop Thanksgiving', '/shop',
   'Thankful for the little things.',
   'Handpainted cards and prints that say it better than words.',
   'Shop Gift Ideas', '/shop'),

  ('Christmas', 11, 29, 12, 26, 10,
   'The gift of something handmade.',
   'Watercolor prints, cards, and stickers that wrap up beautifully.',
   'Shop Holiday Gifts', '/shop',
   'Wrapped up in joy.',
   'Give art this season — prints, cards, and stickers from our studio, ready to gift.',
   'Shop Holiday Gift Guide', '/shop'),

  ('New Year', 12, 27, 1, 10, 7,
   'Here''s to a colorful year ahead.',
   'Start the year with something handmade and full of heart.',
   'Shop New Arrivals', '/shop',
   'Fresh year, fresh walls.',
   'New prints and a new year — the perfect excuse to redecorate.',
   'Shop New Year Picks', '/shop');
