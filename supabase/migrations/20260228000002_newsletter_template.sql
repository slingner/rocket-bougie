alter table newsletter_campaigns
  add column template_id text not null default 'classic',
  add column image_url text;
