alter table collections
  add column if not exists title_uppercase boolean not null default false;
