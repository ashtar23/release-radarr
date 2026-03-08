create extension if not exists pg_trgm;

create index if not exists titles_name_trgm_idx
  on public.titles
  using gin (name gin_trgm_ops);
