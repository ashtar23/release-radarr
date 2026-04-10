create index if not exists titles_home_upcoming_idx
  on public.titles (earliest_release_date asc, rawg_added desc, id asc)
  where earliest_release_date is not null;

create index if not exists titles_home_latest_idx
  on public.titles (earliest_release_date desc, rawg_added desc, id desc)
  where earliest_release_date is not null;

create index if not exists titles_home_popular_idx
  on public.titles (
    rawg_added desc,
    rawg_ratings_count desc,
    rawg_suggestions_count desc,
    id desc
  )
  where earliest_release_date is not null;
