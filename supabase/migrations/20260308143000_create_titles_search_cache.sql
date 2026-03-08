create table if not exists public.titles (
  id text primary key,
  kind text not null check (kind = 'game'),
  source text not null check (source = 'rawg'),
  external_id text not null,
  slug text not null,
  name text not null,
  cover_image_url text,
  earliest_release_date date,
  description text,
  genres text[] not null default '{}'::text[],
  developers text[] not null default '{}'::text[],
  publishers text[] not null default '{}'::text[],
  website_url text,
  platforms jsonb not null default '[]'::jsonb,
  releases jsonb not null default '[]'::jsonb,
  search_updated_at timestamptz not null default timezone('utc', now()),
  detail_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint titles_source_external_id_key unique (source, external_id)
);

create index if not exists titles_name_idx on public.titles (lower(name));
create index if not exists titles_search_updated_at_idx on public.titles (search_updated_at desc);

alter table public.titles enable row level security;
