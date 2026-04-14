import type { QueryResultRow } from "pg";

import { getPostgresPool } from "../postgres";
import { CATALOG_SYNC_SLICE_CONFIGS } from "./config";
import type {
  CatalogSliceConfig,
  CatalogSyncRunRecord,
  CatalogSyncRunSummary,
  CatalogSyncSliceRecord,
} from "./types";

export async function syncCatalogSliceConfigs(
  configs: CatalogSliceConfig[] = CATALOG_SYNC_SLICE_CONFIGS,
) {
  const pool = getPostgresPool();
  if (configs.length === 0) {
    return;
  }

  const values: unknown[] = [];
  const rows = configs.map((config, index) => {
    const base = index * 7;
    values.push(
      config.key,
      config.family,
      config.enabled,
      config.priority,
      JSON.stringify(config.params),
      config.pageBudgetPerRun,
      config.cadenceHours,
    );

    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::jsonb, $${base + 6}, $${base + 7})`;
  });

  await pool.query(
    `
      insert into public.catalog_sync_slices (
        key,
        family,
        enabled,
        priority,
        params_json,
        page_budget_per_run,
        cadence_hours
      )
      values ${rows.join(", ")}
      on conflict (key) do update
      set
        family = excluded.family,
        enabled = excluded.enabled,
        priority = excluded.priority,
        params_json = excluded.params_json,
        page_budget_per_run = excluded.page_budget_per_run,
        cadence_hours = excluded.cadence_hours,
        updated_at = now()
    `,
    values,
  );
}

export async function createCatalogSyncRun() {
  const pool = getPostgresPool();
  const result = await pool.query<{
    id: string;
    started_at: Date;
    status: "running";
  }>(
    `
      insert into public.catalog_sync_runs (status)
      values ('running')
      returning id, started_at, status
    `,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create catalog sync run.");
  }

  return {
    id: row.id,
    startedAt: row.started_at.toISOString(),
    status: row.status,
  } satisfies CatalogSyncRunRecord;
}

export async function finalizeCatalogSyncRun(summary: CatalogSyncRunSummary) {
  const pool = getPostgresPool();
  await pool.query(
    `
      update public.catalog_sync_runs
      set
        status = $2,
        finished_at = now(),
        list_requests_used = $3,
        detail_requests_used = $4,
        fetched_count = $5,
        unique_count = $6,
        upserted_count = $7,
        enriched_count = $8,
        notes = jsonb_build_object('executedSliceCount', $9)
      where id = $1
    `,
    [
      summary.runId,
      summary.status,
      summary.listRequestsUsed,
      summary.detailRequestsUsed,
      summary.fetchedCount,
      summary.uniqueCount,
      summary.upsertedCount,
      summary.enrichedCount,
      summary.executedSliceCount,
    ],
  );
}

export async function listCatalogSyncSlices() {
  const pool = getPostgresPool();
  const result = await pool.query<CatalogSyncSliceRow>(
    `
      select
        key,
        family,
        enabled,
        priority,
        params_json,
        page_budget_per_run,
        cadence_hours,
        next_page,
        failure_count,
        last_run_at,
        last_success_at,
        last_status,
        last_fetched_count,
        last_upserted_count
      from public.catalog_sync_slices
    `,
  );

  return result.rows.map(mapCatalogSyncSliceRow);
}

export async function getRecentCatalogSyncUsage() {
  const pool = getPostgresPool();
  const result = await pool.query<{
    list_requests_used: string | number | null;
    detail_requests_used: string | number | null;
  }>(
    `
      select
        coalesce(sum(list_requests_used), 0) as list_requests_used,
        coalesce(sum(detail_requests_used), 0) as detail_requests_used
      from public.catalog_sync_runs
      where started_at >= now() - interval '24 hours'
    `,
  );

  const row = result.rows[0];
  return {
    listRequestsUsed: Number(row?.list_requests_used ?? 0),
    detailRequestsUsed: Number(row?.detail_requests_used ?? 0),
  };
}

export async function applyCatalogSyncSliceOutcome(params: {
  key: string;
  fetchedCount: number;
  upsertedCount: number;
  succeeded: boolean;
  nextPage: number;
}) {
  const pool = getPostgresPool();
  await pool.query(
    `
      update public.catalog_sync_slices
      set
        last_run_at = now(),
        last_success_at = case when $4 then now() else last_success_at end,
        last_status = case when $4 then 'success' else 'failed' end,
        next_page = $5,
        failure_count = case when $4 then 0 else failure_count + 1 end,
        last_fetched_count = $2,
        last_upserted_count = $3,
        updated_at = now()
      where key = $1
    `,
    [
      params.key,
      params.fetchedCount,
      params.upsertedCount,
      params.succeeded,
      params.nextPage,
    ],
  );
}

type CatalogSyncSliceRow = QueryResultRow & {
  key: string;
  family: CatalogSyncSliceRecord["family"];
  enabled: boolean;
  priority: number;
  params_json: CatalogSyncSliceRecord["paramsJson"];
  page_budget_per_run: number;
  cadence_hours: number;
  next_page: number;
  failure_count: number;
  last_run_at: Date | null;
  last_success_at: Date | null;
  last_status: string | null;
  last_fetched_count: number;
  last_upserted_count: number;
};

function mapCatalogSyncSliceRow(
  row: CatalogSyncSliceRow,
): CatalogSyncSliceRecord {
  return {
    key: row.key,
    family: row.family,
    enabled: row.enabled,
    priority: row.priority,
    paramsJson: row.params_json,
    pageBudgetPerRun: row.page_budget_per_run,
    cadenceHours: row.cadence_hours,
    nextPage: row.next_page,
    failureCount: row.failure_count,
    lastRunAt: row.last_run_at?.toISOString() ?? null,
    lastSuccessAt: row.last_success_at?.toISOString() ?? null,
    lastStatus: row.last_status,
    lastFetchedCount: row.last_fetched_count,
    lastUpsertedCount: row.last_upserted_count,
  };
}
