create extension if not exists pgcrypto;
create schema if not exists app;

create table if not exists app.users (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  country_code text,
  locale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  provider text not null,
  external_subject text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_subject),
  unique (user_id, provider)
);

create table if not exists app.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users(id) on delete cascade,
  chain text not null check (chain in ('solana')),
  address text not null,
  role text not null check (role in ('embedded', 'external')),
  custody_provider text not null default 'privy',
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain, address)
);

create unique index if not exists wallets_one_active_embedded_per_user_idx
  on app.wallets(user_id, chain)
  where role = 'embedded' and is_active = true;

create index if not exists auth_identities_user_id_idx
  on app.auth_identities(user_id);

create index if not exists wallets_user_id_idx
  on app.wallets(user_id);
