drop index if exists public.watchlists_user_created_at_idx;

create index if not exists watchlists_user_created_at_id_idx
  on public.watchlists (user_id, created_at desc, id desc);

drop index if exists public.titles_earliest_release_date_idx;

create index if not exists titles_earliest_release_date_id_idx
  on public.titles (earliest_release_date, id)
  where earliest_release_date is not null;

create index if not exists titles_search_name_id_idx
  on public.titles (search_name, id);

create or replace view public.watchlist_items as
select
  w.id,
  w.user_id,
  w.title_id,
  w.created_at as added_at,
  t.kind,
  t.source,
  t.external_id,
  t.slug,
  t.name,
  t.cover_image_url,
  t.earliest_release_date,
  t.platforms,
  t.releases,
  t.created_at as title_created_at,
  t.updated_at,
  t.search_updated_at,
  t.detail_updated_at,
  t.description,
  t.genres,
  t.developers,
  t.publishers,
  t.website_url,
  t.rawg_rating,
  t.rawg_ratings_count,
  t.rawg_metacritic,
  t.rawg_added,
  t.rawg_reviews_count,
  t.rawg_suggestions_count,
  t.rawg_rating_top,
  t.search_name,
  case
    when t.earliest_release_date is null then 1
    else 0
  end as release_sort_bucket
from public.watchlists w
join public.titles t on t.id = w.title_id;
