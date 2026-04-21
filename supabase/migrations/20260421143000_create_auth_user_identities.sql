create table if not exists public.auth_user_identities (
  user_id uuid primary key,
  email text not null,
  email_normalized text generated always as (
    lower(btrim(email))
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists auth_user_identities_email_normalized_key
  on public.auth_user_identities (email_normalized);
