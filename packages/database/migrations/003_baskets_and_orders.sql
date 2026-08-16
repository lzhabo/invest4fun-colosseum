create schema if not exists app;

create table if not exists app.baskets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'confirmed', 'cancelled')),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.basket_items (
  id uuid primary key default gen_random_uuid(),
  basket_id uuid not null references app.baskets(id) on delete cascade,
  source_kind text not null check (source_kind in ('asset', 'idea')),
  source_id text not null,
  title_snapshot text not null,
  amount_cents integer not null check (amount_cents >= 10),
  created_at timestamptz not null default now(),
  unique (basket_id, source_kind, source_id)
);

create table if not exists app.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  basket_id uuid not null references app.baskets(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'quoted', 'prepared', 'submitted', 'settled', 'partial', 'failed', 'cancelled')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists baskets_user_id_idx on app.baskets(user_id, created_at desc);
create index if not exists basket_items_basket_id_idx on app.basket_items(basket_id);
create index if not exists orders_user_id_idx on app.orders(user_id, created_at desc);
