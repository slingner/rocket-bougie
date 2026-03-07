create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  stripe_customer_id text not null,
  stripe_subscription_id text unique not null,
  email text not null,
  name text,
  status text not null default 'active',
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;
-- No public read — admin only via service role
