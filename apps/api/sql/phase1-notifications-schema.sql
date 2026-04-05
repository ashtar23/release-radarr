create table if not exists public.notification_preferences (
  user_id uuid primary key,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default false,
  release_date_changed_enabled boolean not null default true,
  release_approaching_enabled boolean not null default true,
  timing_presets text[] not null default array['on_day']::text[],
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_preferences_timing_presets_check check (
    timing_presets <@ array['on_day', 'hours_24_before', 'days_7_before', 'days_30_before']::text[]
  )
);

create table if not exists public.notification_events (
  id text primary key,
  title_id text not null references public.titles(id) on delete cascade,
  event_type text not null,
  event_version integer not null,
  event_key text not null unique,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notification_events_event_type_check check (
    event_type in ('release_date_changed', 'release_approaching')
  ),
  constraint notification_events_event_version_check check (event_version >= 1)
);

create index if not exists notification_events_title_occurred_at_idx
  on public.notification_events (title_id, occurred_at desc, id desc);

create table if not exists public.notification_records (
  id text primary key,
  user_id uuid not null,
  event_id text not null references public.notification_events(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  event_type text not null,
  destination_kind text not null,
  destination_title_id text not null references public.titles(id) on delete cascade,
  title_name text not null,
  title_artwork_url text,
  message text not null,
  subtitle text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz,
  constraint notification_records_event_type_check check (
    event_type in ('release_date_changed', 'release_approaching')
  ),
  constraint notification_records_destination_kind_check check (
    destination_kind in ('title')
  ),
  constraint notification_records_event_user_key unique (event_id, user_id)
);

create index if not exists notification_records_user_created_at_idx
  on public.notification_records (user_id, created_at desc, id desc);

create index if not exists notification_records_user_unread_idx
  on public.notification_records (user_id, created_at desc, id desc)
  where read_at is null;

create or replace function public.notify_notification_records_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform pg_notify(
      'notifications_realtime',
      json_build_object(
        'userId', new.user_id::text,
        'scope', 'records'
      )::text
    );
    return null;
  end if;

  if tg_op = 'UPDATE' and new.read_at is distinct from old.read_at then
    perform pg_notify(
      'notifications_realtime',
      json_build_object(
        'userId', new.user_id::text,
        'scope', 'records'
      )::text
    );
  end if;

  return null;
end;
$$;

drop trigger if exists notification_records_realtime_trigger on public.notification_records;

create trigger notification_records_realtime_trigger
after insert or update on public.notification_records
for each row
execute function public.notify_notification_records_change();

create or replace function public.notify_notification_preferences_change()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify(
    'notifications_realtime',
    json_build_object(
      'userId', new.user_id::text,
      'scope', 'preferences'
    )::text
  );

  return null;
end;
$$;

drop trigger if exists notification_preferences_realtime_trigger on public.notification_preferences;

create trigger notification_preferences_realtime_trigger
after insert or update on public.notification_preferences
for each row
execute function public.notify_notification_preferences_change();
