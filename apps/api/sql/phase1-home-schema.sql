create extension if not exists pg_trgm;

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
  rawg_rating double precision,
  rawg_ratings_count integer,
  rawg_metacritic integer,
  rawg_added integer,
  rawg_reviews_count integer,
  rawg_suggestions_count integer,
  rawg_rating_top integer,
  search_name text not null,
  constraint titles_source_external_id_key unique (source, external_id),
  constraint titles_rawg_rating_range_chk
    check (rawg_rating is null or (rawg_rating >= 0 and rawg_rating <= 5)),
  constraint titles_rawg_metacritic_range_chk
    check (rawg_metacritic is null or (rawg_metacritic >= 0 and rawg_metacritic <= 100)),
  constraint titles_rawg_ratings_count_non_negative_chk
    check (rawg_ratings_count is null or rawg_ratings_count >= 0),
  constraint titles_rawg_added_non_negative_chk
    check (rawg_added is null or rawg_added >= 0),
  constraint titles_rawg_reviews_count_non_negative_chk
    check (rawg_reviews_count is null or rawg_reviews_count >= 0),
  constraint titles_rawg_suggestions_count_non_negative_chk
    check (rawg_suggestions_count is null or rawg_suggestions_count >= 0),
  constraint titles_rawg_rating_top_non_negative_chk
    check (rawg_rating_top is null or rawg_rating_top >= 0)
);

create index if not exists titles_name_idx on public.titles (lower(name));
create index if not exists titles_search_updated_at_idx on public.titles (search_updated_at desc);
create index if not exists titles_search_name_trgm_idx
  on public.titles
  using gin (search_name gin_trgm_ops);
