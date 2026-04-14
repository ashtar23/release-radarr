import test from "node:test";
import assert from "node:assert/strict";
import type { TitleSummary } from "@repo/types";

import { runCatalogSync } from "./executor";
import type { CatalogSyncSliceRecord } from "./types";

test("runCatalogSync syncs configs, plans slices, dedupes overlap, upserts, and enriches a capped subset", async () => {
  const fetchedPages: Array<{ key: string; page: number }> = [];
  const appliedOutcomes: Array<{
    key: string;
    fetchedCount: number;
    upsertedCount: number;
    succeeded: boolean;
    nextPage: number;
  }> = [];
  const upsertCalls: TitleSummary[][] = [];
  const enrichCalls: Array<{ summaries: TitleSummary[]; limit?: number }> = [];
  const runSummaries: Array<{
    status: string;
    uniqueCount: number;
    enrichedCount: number;
    detailCandidatesSelected: number;
  }> = [];

  const alpha = createSummary("rawg:1", "Alpha");
  const beta = createSummary("rawg:2", "Beta");
  const gamma = createSummary("rawg:3", "Gamma");

  const result = await runCatalogSync(
    {
      rawgApiKey: "test-key",
      perRunListBudget: 3,
      dailyListBudget: 20,
      dailyDetailBudget: 5,
      detailLimitPerRun: 2,
    },
    {
      syncCatalogSliceConfigs: async () => {},
      getRecentCatalogSyncUsage: async () => ({
        listRequestsUsed: 0,
        detailRequestsUsed: 0,
      }),
      listCatalogSyncSlices: async () => [
        createSlice("upcoming:pc", { pageBudgetPerRun: 2 }),
        createSlice("recent:pc", {
          family: "recent_by_platform",
          priority: 90,
          pageBudgetPerRun: 1,
          paramsJson: {
            ordering: "-released",
            dateWindow: { startOffsetDays: -90, endOffsetDays: 0 },
            platforms: [4],
          },
          lastRunAt: null,
          lastSuccessAt: null,
        }),
      ],
      createCatalogSyncRun: async () => ({
        id: "run-1",
        startedAt: "2026-04-14T08:30:00.000Z",
        status: "running",
      }),
      fetchCatalogResults: async (params) => {
        const key =
          params.platforms?.[0] === 4 && params.ordering === "-added"
            ? "upcoming:pc"
            : "recent:pc";
        fetchedPages.push({ key, page: params.page });

        if (key === "upcoming:pc" && params.page === 1) {
          return { totalCount: 80, results: [alpha, beta] };
        }

        if (key === "upcoming:pc" && params.page === 2) {
          return { totalCount: 80, results: [beta, gamma] };
        }

        return { totalCount: 40, results: [gamma] };
      },
      upsertSummaries: async (summaries) => {
        upsertCalls.push(summaries);
      },
      enrichSummaries: async (params) => {
        enrichCalls.push({
          summaries: params.summaries,
          limit: params.limit,
        });
        return params.summaries.length;
      },
      applyCatalogSyncSliceOutcome: async (outcome) => {
        appliedOutcomes.push(outcome);
      },
      finalizeCatalogSyncRun: async (summary) => {
        runSummaries.push({
          status: summary.status,
          uniqueCount: summary.uniqueCount,
          enrichedCount: summary.enrichedCount,
          detailCandidatesSelected: summary.detailCandidatesSelected,
        });
      },
    },
  );

  assert.deepEqual(fetchedPages, [
    { key: "upcoming:pc", page: 1 },
    { key: "recent:pc", page: 1 },
  ]);
  assert.equal(upsertCalls.length, 1);
  assert.deepEqual(
    upsertCalls[0]?.map((summary) => summary.id),
    ["rawg:1", "rawg:2", "rawg:3"],
  );
  assert.equal(enrichCalls.length, 1);
  assert.equal(enrichCalls[0]?.summaries.length, 2);
  assert.deepEqual(
    appliedOutcomes.map((outcome) => ({
      key: outcome.key,
      nextPage: outcome.nextPage,
      succeeded: outcome.succeeded,
    })),
    [
      { key: "upcoming:pc", nextPage: 1, succeeded: true },
      { key: "recent:pc", nextPage: 1, succeeded: true },
    ],
  );
  assert.deepEqual(runSummaries, [
    {
      status: "completed",
      uniqueCount: 3,
      enrichedCount: 2,
      detailCandidatesSelected: 2,
    },
  ]);
  assert.equal(result.listRequestsUsed, 2);
  assert.equal(result.uniqueCount, 3);
});

function createSlice(
  key: string,
  overrides: Partial<CatalogSyncSliceRecord> = {},
): CatalogSyncSliceRecord {
  return {
    key,
    family: "upcoming_by_platform",
    enabled: true,
    priority: 100,
    paramsJson: {
      ordering: "-added",
      dateWindow: { startOffsetDays: 0, endOffsetDays: 365 },
      platforms: [4],
    },
    pageBudgetPerRun: 2,
    cadenceHours: 4,
    nextPage: 1,
    failureCount: 0,
    lastRunAt: null,
    lastSuccessAt: null,
    lastStatus: null,
    lastFetchedCount: 0,
    lastUpsertedCount: 0,
    ...overrides,
  };
}

function createSummary(id: string, name: string): TitleSummary {
  const externalId = id.replace("rawg:", "");

  return {
    id,
    kind: "game",
    source: "rawg",
    externalId,
    slug: name.toLowerCase(),
    name,
    coverImageUrl: null,
    earliestReleaseDate: "2026-04-10",
    platforms: [{ id: "rawg-platform:4", name: "PC" }],
    rawgRating: 4.2,
    rawgRatingsCount: 100,
    rawgMetacritic: 80,
    rawgAdded: 200,
    rawgReviewsCount: 50,
    rawgSuggestionsCount: 120,
    rawgRatingTop: 5,
  };
}
