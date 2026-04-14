create table if not exists public.catalog_sync_slices (
  key text primary key,
  family text not null,
  enabled boolean not null default true,
  priority integer not null default 100,
  params_json jsonb not null,
  page_budget_per_run integer not null default 2,
  cadence_hours integer not null default 24,
  next_page integer not null default 1,
  failure_count integer not null default 0,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_status text,
  last_fetched_count integer not null default 0,
  last_upserted_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_sync_slices_page_budget_positive
    check (page_budget_per_run > 0),
  constraint catalog_sync_slices_cadence_positive
    check (cadence_hours > 0),
  constraint catalog_sync_slices_next_page_positive
    check (next_page > 0)
);

create index if not exists catalog_sync_slices_enabled_priority_idx
  on public.catalog_sync_slices (enabled, priority desc, last_success_at asc nulls first);

create table if not exists public.catalog_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  list_requests_used integer not null default 0,
  detail_requests_used integer not null default 0,
  fetched_count integer not null default 0,
  unique_count integer not null default 0,
  upserted_count integer not null default 0,
  enriched_count integer not null default 0,
  notes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists catalog_sync_runs_started_at_idx
  on public.catalog_sync_runs (started_at desc);
