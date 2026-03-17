create table if not exists public.watchlists (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint watchlists_user_id_title_id_key unique (user_id, title_id)
);

create index if not exists watchlists_user_created_at_idx
  on public.watchlists (user_id, created_at desc);

create index if not exists watchlists_title_id_idx
  on public.watchlists (title_id);

alter table public.watchlists enable row level security;

create policy if not exists "watchlists_select_own"
  on public.watchlists
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "watchlists_insert_own"
  on public.watchlists
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "watchlists_delete_own"
  on public.watchlists
  for delete
  to authenticated
  using (auth.uid() = user_id);
