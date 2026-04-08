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
