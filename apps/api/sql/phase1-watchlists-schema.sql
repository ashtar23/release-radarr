create table if not exists public.watchlists (
  id text primary key,
  user_id uuid not null,
  title_id text not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint watchlists_user_id_title_id_key unique (user_id, title_id)
);

create index if not exists watchlists_user_created_at_idx
  on public.watchlists (user_id, created_at desc);

create index if not exists watchlists_title_id_idx
  on public.watchlists (title_id);
