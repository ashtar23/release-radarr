create index if not exists titles_search_name_tsv_idx
  on public.titles
  using gin (to_tsvector('simple', search_name));
