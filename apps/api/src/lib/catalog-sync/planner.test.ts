import test from "node:test";
import assert from "node:assert/strict";

import { planCatalogSync } from "./planner";
import type { CatalogSyncSliceRecord } from "./types";

test("plans stale high-priority slices first within the run budget", () => {
  const plan = planCatalogSync({
    slices: [
      createSlice("popular:pc", {
        priority: 110,
        lastRunAt: "2026-04-14T06:00:00.000Z",
        lastSuccessAt: "2026-04-14T06:00:00.000Z",
      }),
      createSlice("upcoming:pc", {
        priority: 140,
        lastRunAt: "2026-04-14T00:00:00.000Z",
        lastSuccessAt: "2026-04-14T00:00:00.000Z",
        pageBudgetPerRun: 3,
      }),
      createSlice("recent:pc", {
        priority: 120,
        lastRunAt: null,
        lastSuccessAt: null,
      }),
    ],
    recentListRequestsUsed: 0,
    recentDetailRequestsUsed: 0,
    perRunListBudget: 4,
    dailyListBudget: 250,
    dailyDetailBudget: 16,
    now: new Date("2026-04-14T08:30:00.000Z"),
  });

  assert.equal(plan.listRequestBudget, 4);
  assert.equal(plan.tasks.length, 2);
  assert.deepEqual(
    plan.tasks.map((task) => ({
      key: task.slice.key,
      pages: task.pages,
    })),
    [
      { key: "upcoming:pc", pages: [1, 2, 3] },
      { key: "recent:pc", pages: [1] },
    ],
  );
});

test("returns no tasks when the daily list budget is exhausted", () => {
  const plan = planCatalogSync({
    slices: [createSlice("upcoming:pc")],
    recentListRequestsUsed: 250,
    recentDetailRequestsUsed: 0,
    dailyListBudget: 250,
    now: new Date("2026-04-14T08:30:00.000Z"),
  });

  assert.deepEqual(plan, {
    listRequestBudget: 0,
    detailCandidateBudget: 16,
    tasks: [],
  });
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
    lastRunAt: "2026-04-14T00:00:00.000Z",
    lastSuccessAt: "2026-04-14T00:00:00.000Z",
    lastStatus: "success",
    lastFetchedCount: 40,
    lastUpsertedCount: 32,
    ...overrides,
  };
}
