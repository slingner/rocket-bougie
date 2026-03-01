-- Newsletter subscribers
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  unsubscribe_token uuid not null default gen_random_uuid(),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text default 'signup_form'
);

create index on newsletter_subscribers (email);
create index on newsletter_subscribers (status);
create index on newsletter_subscribers (unsubscribe_token);

-- Newsletter campaigns
create table newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preview_text text,
  content_html text not null,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  sent_at timestamptz,
  recipient_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Block public access — admin client (service role) bypasses RLS
alter table newsletter_subscribers enable row level security;
alter table newsletter_campaigns enable row level security;
