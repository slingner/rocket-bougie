create table saved_for_later (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id text not null,
  product_id text not null,
  handle text not null,
  title text not null,
  variant_title text,
  price numeric(10,2) not null,
  image_url text,
  tags text[] default '{}',
  saved_at timestamptz default now(),
  unique(user_id, variant_id)
);

alter table saved_for_later enable row level security;

create policy "Users can manage their own saved items"
  on saved_for_later
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
