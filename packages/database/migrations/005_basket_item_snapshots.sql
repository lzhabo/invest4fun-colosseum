alter table app.basket_items
  add column if not exists source_version_id text,
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

create index if not exists basket_items_source_version_idx
  on app.basket_items(source_kind, source_id, source_version_id);
