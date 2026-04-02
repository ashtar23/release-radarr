create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
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
  user_id uuid not null references auth.users(id) on delete cascade,
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

alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_records enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
  on public.notification_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notification_records_select_own" on public.notification_records;
create policy "notification_records_select_own"
  on public.notification_records
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notification_records_update_own" on public.notification_records;
create policy "notification_records_update_own"
  on public.notification_records
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
