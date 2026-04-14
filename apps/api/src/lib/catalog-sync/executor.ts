import type { TitleSummary } from "@repo/types";

import { fetchRawgGameListResults } from "../rawg";
import { enrichTitleSummaries, upsertTitleSummaries } from "../search/data";
import {
  CATALOG_SYNC_DEFAULT_DETAIL_LIMIT_PER_RUN,
  CATALOG_SYNC_PAGE_SIZE,
} from "./config";
import { selectCatalogEnrichmentCandidates } from "./enrichment";
import {
  applyCatalogSyncSliceOutcome,
  createCatalogSyncRun,
  finalizeCatalogSyncRun,
  getRecentCatalogSyncUsage,
  listCatalogSyncSlices,
  syncCatalogSliceConfigs,
} from "./repository";
import { planCatalogSync } from "./planner";
import type {
  CatalogSyncDependencies,
  CatalogSyncRunSummary,
  CatalogSyncTask,
} from "./types";

export async function runCatalogSync(
  params: {
    rawgApiKey: string;
    now?: Date;
    perRunListBudget?: number;
    dailyListBudget?: number;
    dailyDetailBudget?: number;
    detailLimitPerRun?: number;
  },
  dependencies?: Partial<CatalogSyncDependencies> & {
    syncCatalogSliceConfigs?: typeof syncCatalogSliceConfigs;
    getRecentCatalogSyncUsage?: typeof getRecentCatalogSyncUsage;
    listCatalogSyncSlices?: typeof listCatalogSyncSlices;
    createCatalogSyncRun?: typeof createCatalogSyncRun;
    finalizeCatalogSyncRun?: typeof finalizeCatalogSyncRun;
    applyCatalogSyncSliceOutcome?: typeof applyCatalogSyncSliceOutcome;
  },
) {
  if (!params.rawgApiKey) {
    throw new Error("RAWG_API_KEY is required for catalog sync.");
  }

  const deps = {
    fetchCatalogResults: fetchRawgGameListResults,
    upsertSummaries: upsertTitleSummaries,
    enrichSummaries: enrichTitleSummaries,
    syncCatalogSliceConfigs,
    getRecentCatalogSyncUsage,
    listCatalogSyncSlices,
    createCatalogSyncRun,
    finalizeCatalogSyncRun,
    applyCatalogSyncSliceOutcome,
    ...dependencies,
  };
  const runDate = params.now ?? new Date();

  await deps.syncCatalogSliceConfigs();

  const [usage, slices, run] = await Promise.all([
    deps.getRecentCatalogSyncUsage(),
    deps.listCatalogSyncSlices(),
    deps.createCatalogSyncRun(),
  ]);

  try {
    const plan = planCatalogSync({
      slices,
      recentListRequestsUsed: usage.listRequestsUsed,
      recentDetailRequestsUsed: usage.detailRequestsUsed,
      perRunListBudget: params.perRunListBudget,
      dailyListBudget: params.dailyListBudget,
      dailyDetailBudget: params.dailyDetailBudget,
      now: params.now,
    });

    const fetchedSummaries: TitleSummary[] = [];
    let listRequestsUsed = 0;
    let fetchedCount = 0;
    let executedSliceCount = 0;

    for (const task of plan.tasks) {
      const outcome = await executeCatalogSyncTask({
        task,
        runDate,
        rawgApiKey: params.rawgApiKey,
        fetchCatalogResults: deps.fetchCatalogResults,
      });

      fetchedSummaries.push(...outcome.summaries);
      listRequestsUsed += outcome.listRequestsUsed;
      fetchedCount += outcome.fetchedCount;
      executedSliceCount += 1;

      await deps.applyCatalogSyncSliceOutcome({
        key: task.slice.key,
        fetchedCount: outcome.fetchedCount,
        upsertedCount: outcome.summaries.length,
        succeeded: outcome.succeeded,
        nextPage: outcome.nextPage,
      });
    }

    const uniqueSummaries = dedupeTitleSummaries(fetchedSummaries);
    if (uniqueSummaries.length > 0) {
      await deps.upsertSummaries(uniqueSummaries);
    }

    const detailLimit = Math.min(
      params.detailLimitPerRun ?? CATALOG_SYNC_DEFAULT_DETAIL_LIMIT_PER_RUN,
      plan.detailRequestBudget,
    );
    const enrichmentCandidates = selectCatalogEnrichmentCandidates({
      summaries: uniqueSummaries,
      limit: detailLimit,
    });
    const enrichedCount =
      enrichmentCandidates.length > 0
        ? await deps.enrichSummaries({
            summaries: enrichmentCandidates,
            rawgApiKey: params.rawgApiKey,
            limit: enrichmentCandidates.length,
          })
        : 0;

    const summary = {
      runId: run.id,
      status: "completed",
      listRequestsUsed,
      detailRequestsUsed: enrichmentCandidates.length,
      fetchedCount,
      uniqueCount: uniqueSummaries.length,
      upsertedCount: uniqueSummaries.length,
      enrichedCount,
      executedSliceCount,
    } satisfies CatalogSyncRunSummary;

    await deps.finalizeCatalogSyncRun(summary);
    return summary;
  } catch (error) {
    await deps.finalizeCatalogSyncRun({
      runId: run.id,
      status: "failed",
      listRequestsUsed: 0,
      detailRequestsUsed: 0,
      fetchedCount: 0,
      uniqueCount: 0,
      upsertedCount: 0,
      enrichedCount: 0,
      executedSliceCount: 0,
    });
    throw error;
  }
}

async function executeCatalogSyncTask(params: {
  task: CatalogSyncTask;
  runDate: Date;
  rawgApiKey: string;
  fetchCatalogResults: CatalogSyncDependencies["fetchCatalogResults"];
}) {
  const summaries: TitleSummary[] = [];
  let fetchedCount = 0;
  let fetchAttempts = 0;
  let succeeded = true;
  let lastFetchedPageCount = 0;
  let finalRequestedPage = params.task.slice.nextPage;

  try {
    for (const page of params.task.pages) {
      finalRequestedPage = page;
      fetchAttempts += 1;
      const result = await params.fetchCatalogResults({
        rawgApiKey: params.rawgApiKey,
        pageSize: CATALOG_SYNC_PAGE_SIZE,
        page,
        ordering: params.task.slice.paramsJson.ordering,
        dates: resolveCatalogSyncDates(
          params.task.slice.paramsJson.dateWindow,
          params.runDate,
        ),
        platforms: params.task.slice.paramsJson.platforms,
        genres: params.task.slice.paramsJson.genres,
        metacritic: params.task.slice.paramsJson.metacritic,
      });

      summaries.push(...result.results);
      fetchedCount += result.results.length;
      lastFetchedPageCount = result.results.length;

      if (result.results.length < CATALOG_SYNC_PAGE_SIZE) {
        break;
      }
    }
  } catch (error) {
    console.error("Catalog sync slice failed.", {
      key: params.task.slice.key,
      error,
    });
    succeeded = false;
  }

  return {
    summaries,
    fetchedCount,
    listRequestsUsed: fetchAttempts,
    succeeded,
    nextPage:
      !succeeded || lastFetchedPageCount < CATALOG_SYNC_PAGE_SIZE
        ? 1
        : finalRequestedPage + 1,
  };
}

function resolveCatalogSyncDates(
  dateWindow: { startOffsetDays: number; endOffsetDays: number },
  baseDate: Date,
) {
  return `${toIsoDate(addDays(baseDate, dateWindow.startOffsetDays))},${toIsoDate(
    addDays(baseDate, dateWindow.endOffsetDays),
  )}`;
}

function dedupeTitleSummaries(summaries: TitleSummary[]) {
  const deduped = new Map<string, TitleSummary>();

  for (const summary of summaries) {
    if (!deduped.has(summary.id)) {
      deduped.set(summary.id, summary);
    }
  }

  return Array.from(deduped.values());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
