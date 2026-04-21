create table if not exists public.user_profiles (
  user_id uuid primary key,
  username text,
  username_normalized text generated always as (
    case
      when username is null then null
      else lower(btrim(username))
    end
  ) stored,
  display_name text,
  avatar_url text,
  bio text,
  watchlist_visibility text not null default 'friends',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_profiles_watchlist_visibility_check
    check (watchlist_visibility in ('private', 'friends', 'public'))
);

create unique index if not exists user_profiles_username_normalized_key
  on public.user_profiles (username_normalized)
  where username_normalized is not null;

create table if not exists public.user_follows (
  follower_user_id uuid not null,
  followed_user_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_follows_pkey primary key (follower_user_id, followed_user_id),
  constraint user_follows_no_self_follow
    check (follower_user_id <> followed_user_id)
);

create index if not exists user_follows_follower_created_at_idx
  on public.user_follows (follower_user_id, created_at desc, followed_user_id);

create index if not exists user_follows_followed_created_at_idx
  on public.user_follows (followed_user_id, created_at desc, follower_user_id);

create table if not exists public.watchlist_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title_id text not null references public.titles(id) on delete cascade,
  event_type text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint watchlist_events_event_type_check
    check (event_type in ('added', 'removed'))
);

create index if not exists watchlist_events_user_created_at_idx
  on public.watchlist_events (user_id, created_at desc, id);

create index if not exists watchlist_events_title_created_at_idx
  on public.watchlist_events (title_id, created_at desc, id);

insert into public.user_profiles (
  user_id,
  display_name,
  watchlist_visibility
)
select distinct
  seed.user_id,
  'Soonr user',
  'friends'
from (
  select user_id from public.watchlists
  union
  select user_id from public.notification_preferences
  union
  select user_id from public.notification_records
) as seed
on conflict (user_id) do nothing;
