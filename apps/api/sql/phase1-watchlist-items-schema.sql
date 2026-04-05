alter table public.watchlists
  add column if not exists search_name text,
  add column if not exists earliest_release_date date,
  add column if not exists release_sort_bucket integer not null default 1;

update public.watchlists w
set
  search_name = t.search_name,
  earliest_release_date = t.earliest_release_date,
  release_sort_bucket = case
    when t.earliest_release_date is null then 1
    else 0
  end
from public.titles t
where t.id = w.title_id
  and (
    w.search_name is distinct from t.search_name
    or w.earliest_release_date is distinct from t.earliest_release_date
    or w.release_sort_bucket is distinct from case
      when t.earliest_release_date is null then 1
      else 0
    end
  );

alter table public.watchlists
  alter column search_name set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'watchlists_release_sort_bucket_check'
      and conrelid = 'public.watchlists'::regclass
  ) then
    alter table public.watchlists
      add constraint watchlists_release_sort_bucket_check
      check (release_sort_bucket in (0, 1));
  end if;
end;
$$;

create or replace function public.sync_watchlist_sort_keys_from_title()
returns trigger
language plpgsql
as $$
declare
  source_title public.titles%rowtype;
begin
  select *
  into source_title
  from public.titles
  where id = new.title_id;

  if source_title.id is null then
    raise exception 'Title % not found for watchlist sync.', new.title_id;
  end if;

  new.search_name := source_title.search_name;
  new.earliest_release_date := source_title.earliest_release_date;
  new.release_sort_bucket := case
    when source_title.earliest_release_date is null then 1
    else 0
  end;

  return new;
end;
$$;

drop trigger if exists watchlists_sync_sort_keys_before_write on public.watchlists;

create trigger watchlists_sync_sort_keys_before_write
before insert or update of title_id
on public.watchlists
for each row
execute function public.sync_watchlist_sort_keys_from_title();

create or replace function public.sync_watchlists_for_title_update()
returns trigger
language plpgsql
as $$
begin
  update public.watchlists
  set
    search_name = new.search_name,
    earliest_release_date = new.earliest_release_date,
    release_sort_bucket = case
      when new.earliest_release_date is null then 1
      else 0
    end
  where title_id = new.id
    and (
      search_name is distinct from new.search_name
      or earliest_release_date is distinct from new.earliest_release_date
      or release_sort_bucket is distinct from case
        when new.earliest_release_date is null then 1
        else 0
      end
    );

  return null;
end;
$$;

drop trigger if exists titles_sync_watchlists_after_sort_key_update on public.titles;

create trigger titles_sync_watchlists_after_sort_key_update
after update of search_name, earliest_release_date
on public.titles
for each row
when (
  old.search_name is distinct from new.search_name
  or old.earliest_release_date is distinct from new.earliest_release_date
)
execute function public.sync_watchlists_for_title_update();

drop index if exists public.watchlists_user_created_at_idx;

create index if not exists watchlists_user_created_at_id_idx
  on public.watchlists (user_id, created_at desc, id desc);

create index if not exists watchlists_user_search_name_id_idx
  on public.watchlists (user_id, search_name, id);

create index if not exists watchlists_user_release_sort_idx
  on public.watchlists (user_id, release_sort_bucket, earliest_release_date, id);

create index if not exists watchlists_search_name_trgm_idx
  on public.watchlists
  using gin (search_name gin_trgm_ops);

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
  w.earliest_release_date,
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
  w.search_name,
  w.release_sort_bucket
from public.watchlists w
join public.titles t on t.id = w.title_id;

create or replace function public.list_watchlist_items_page(
  p_user_id uuid,
  p_sort text,
  p_query text default null,
  p_limit integer default 20,
  p_added_at_cursor timestamptz default null,
  p_id_cursor text default null,
  p_search_name_cursor text default null,
  p_release_date_cursor date default null,
  p_release_bucket_cursor integer default null
)
returns setof public.watchlist_items
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
begin
  if p_sort = 'added-asc' then
    return query
    select *
    from public.watchlist_items wi
    where wi.user_id = p_user_id
      and (p_query is null or wi.search_name ilike '%' || p_query || '%')
      and (
        p_added_at_cursor is null
        or wi.added_at > p_added_at_cursor
        or (wi.added_at = p_added_at_cursor and wi.id > p_id_cursor)
      )
    order by wi.added_at asc, wi.id asc
    limit normalized_limit + 1;
  elsif p_sort = 'added-desc' then
    return query
    select *
    from public.watchlist_items wi
    where wi.user_id = p_user_id
      and (p_query is null or wi.search_name ilike '%' || p_query || '%')
      and (
        p_added_at_cursor is null
        or wi.added_at < p_added_at_cursor
        or (wi.added_at = p_added_at_cursor and wi.id < p_id_cursor)
      )
    order by wi.added_at desc, wi.id desc
    limit normalized_limit + 1;
  elsif p_sort = 'name-asc' then
    return query
    select *
    from public.watchlist_items wi
    where wi.user_id = p_user_id
      and (p_query is null or wi.search_name ilike '%' || p_query || '%')
      and (
        p_search_name_cursor is null
        or wi.search_name > p_search_name_cursor
        or (wi.search_name = p_search_name_cursor and wi.id > p_id_cursor)
      )
    order by wi.search_name asc, wi.id asc
    limit normalized_limit + 1;
  elsif p_sort = 'name-desc' then
    return query
    select *
    from public.watchlist_items wi
    where wi.user_id = p_user_id
      and (p_query is null or wi.search_name ilike '%' || p_query || '%')
      and (
        p_search_name_cursor is null
        or wi.search_name < p_search_name_cursor
        or (wi.search_name = p_search_name_cursor and wi.id < p_id_cursor)
      )
    order by wi.search_name desc, wi.id desc
    limit normalized_limit + 1;
  elsif p_sort = 'release-asc' then
    return query
    select *
    from public.watchlist_items wi
    where wi.user_id = p_user_id
      and (p_query is null or wi.search_name ilike '%' || p_query || '%')
      and (
        p_release_bucket_cursor is null
        or wi.release_sort_bucket > p_release_bucket_cursor
        or (
          wi.release_sort_bucket = p_release_bucket_cursor
          and wi.release_sort_bucket = 0
          and (
            wi.earliest_release_date > p_release_date_cursor
            or (
              wi.earliest_release_date = p_release_date_cursor
              and wi.id > p_id_cursor
            )
          )
        )
        or (
          wi.release_sort_bucket = p_release_bucket_cursor
          and wi.release_sort_bucket = 1
          and wi.id > p_id_cursor
        )
      )
    order by wi.release_sort_bucket asc, wi.earliest_release_date asc nulls last, wi.id asc
    limit normalized_limit + 1;
  elsif p_sort = 'release-desc' then
    return query
    select *
    from public.watchlist_items wi
    where wi.user_id = p_user_id
      and (p_query is null or wi.search_name ilike '%' || p_query || '%')
      and (
        p_release_bucket_cursor is null
        or wi.release_sort_bucket > p_release_bucket_cursor
        or (
          wi.release_sort_bucket = p_release_bucket_cursor
          and wi.release_sort_bucket = 0
          and (
            wi.earliest_release_date < p_release_date_cursor
            or (
              wi.earliest_release_date = p_release_date_cursor
              and wi.id < p_id_cursor
            )
          )
        )
        or (
          wi.release_sort_bucket = p_release_bucket_cursor
          and wi.release_sort_bucket = 1
          and wi.id < p_id_cursor
        )
      )
    order by wi.release_sort_bucket asc, wi.earliest_release_date desc nulls last, wi.id desc
    limit normalized_limit + 1;
  else
    raise exception 'Unsupported watchlist sort: %', p_sort;
  end if;
end;
$$;
