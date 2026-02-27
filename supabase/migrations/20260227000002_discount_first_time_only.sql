alter table discount_codes
  add column if not exists first_time_only boolean not null default false;
