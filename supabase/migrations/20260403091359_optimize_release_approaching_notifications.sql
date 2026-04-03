create index if not exists titles_earliest_release_date_idx
  on public.titles (earliest_release_date)
  where earliest_release_date is not null;

create or replace function public.generate_release_approaching_notifications(
  run_date date default timezone('utc', now())::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_record_count integer := 0;
begin
  with due_titles_window as (
    select
      t.id as title_id,
      t.name as title_name,
      t.cover_image_url as title_artwork_url,
      t.earliest_release_date as target_release_date
    from public.titles t
    where t.earliest_release_date between run_date and run_date + 30
  ),
  candidate_preferences as (
    select
      w.user_id,
      dtw.title_id,
      dtw.title_name,
      dtw.title_artwork_url,
      dtw.target_release_date,
      coalesce(np.in_app_enabled, true) as in_app_enabled,
      coalesce(np.release_approaching_enabled, true) as release_approaching_enabled,
      unnest(coalesce(np.timing_presets, array['on_day']::text[])) as timing_preset
    from due_titles_window dtw
    join public.watchlists w on w.title_id = dtw.title_id
    left join public.notification_preferences np on np.user_id = w.user_id
  ),
  due_candidates as (
    select
      cp.user_id,
      cp.title_id,
      cp.title_name,
      cp.title_artwork_url,
      cp.target_release_date,
      cp.timing_preset
    from candidate_preferences cp
    where cp.in_app_enabled
      and cp.release_approaching_enabled
      and (
        (cp.timing_preset = 'on_day' and cp.target_release_date = run_date) or
        (cp.timing_preset = 'hours_24_before' and cp.target_release_date = run_date + 1) or
        (cp.timing_preset = 'days_7_before' and cp.target_release_date = run_date + 7) or
        (cp.timing_preset = 'days_30_before' and cp.target_release_date = run_date + 30)
      )
  ),
  distinct_events as (
    select distinct
      dc.title_id,
      dc.title_name,
      dc.title_artwork_url,
      dc.target_release_date,
      dc.timing_preset
    from due_candidates dc
  ),
  inserted_events as (
    insert into public.notification_events (
      id,
      title_id,
      event_type,
      event_version,
      event_key,
      occurred_at,
      payload
    )
    select
      'notification-event:' || format(
        'release_approaching:%s:%s:%s',
        de.title_id,
        de.target_release_date::text,
        de.timing_preset
      ),
      de.title_id,
      'release_approaching',
      1,
      format(
        'release_approaching:%s:%s:%s',
        de.title_id,
        de.target_release_date::text,
        de.timing_preset
      ),
      timezone('utc', now()),
      jsonb_build_object(
        'targetReleaseDate',
        de.target_release_date::text,
        'timingPreset',
        de.timing_preset
      )
    from distinct_events de
    on conflict (event_key) do nothing
  ),
  resolved_events as (
    select
      ne.id as event_id,
      de.title_id,
      de.title_name,
      de.title_artwork_url,
      de.target_release_date,
      de.timing_preset
    from distinct_events de
    join public.notification_events ne
      on ne.event_key = format(
        'release_approaching:%s:%s:%s',
        de.title_id,
        de.target_release_date::text,
        de.timing_preset
      )
  ),
  inserted_records as (
    insert into public.notification_records (
      id,
      user_id,
      event_id,
      title_id,
      event_type,
      destination_kind,
      destination_title_id,
      title_name,
      title_artwork_url,
      message,
      subtitle,
      payload,
      created_at
    )
    select
      'notification-record:' || re.event_id || ':' || dc.user_id::text,
      dc.user_id,
      re.event_id,
      dc.title_id,
      'release_approaching',
      'title',
      dc.title_id,
      dc.title_name,
      dc.title_artwork_url,
      'Release approaching',
      case dc.timing_preset
        when 'on_day' then 'Releases today'
        when 'hours_24_before' then
          'Releases tomorrow on ' || trim(to_char(dc.target_release_date, 'FMMonth FMDD, YYYY'))
        when 'days_7_before' then
          'Releases in 7 days on ' || trim(to_char(dc.target_release_date, 'FMMonth FMDD, YYYY'))
        when 'days_30_before' then
          'Releases in 30 days on ' || trim(to_char(dc.target_release_date, 'FMMonth FMDD, YYYY'))
        else null
      end,
      jsonb_build_object(
        'targetReleaseDate',
        dc.target_release_date::text,
        'timingPreset',
        dc.timing_preset
      ),
      timezone('utc', now())
    from due_candidates dc
    join resolved_events re
      on re.title_id = dc.title_id
      and re.target_release_date = dc.target_release_date
      and re.timing_preset = dc.timing_preset
    on conflict (event_id, user_id) do nothing
    returning 1
  )
  select count(*)
  into inserted_record_count
  from inserted_records;

  return inserted_record_count;
end;
$$;
