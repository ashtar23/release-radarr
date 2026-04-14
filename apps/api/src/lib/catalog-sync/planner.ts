import {
  CATALOG_SYNC_DEFAULT_DAILY_DETAIL_BUDGET,
  CATALOG_SYNC_DEFAULT_DAILY_LIST_BUDGET,
  CATALOG_SYNC_DEFAULT_LIST_BUDGET_PER_RUN,
} from "./config";
import type {
  CatalogSyncPlan,
  CatalogSyncSliceRecord,
  CatalogSyncTask,
} from "./types";

export function planCatalogSync(params: {
  slices: CatalogSyncSliceRecord[];
  recentListRequestsUsed: number;
  recentDetailRequestsUsed: number;
  perRunListBudget?: number;
  dailyListBudget?: number;
  dailyDetailBudget?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const remainingDailyListBudget = Math.max(
    0,
    (params.dailyListBudget ?? CATALOG_SYNC_DEFAULT_DAILY_LIST_BUDGET) -
      params.recentListRequestsUsed,
  );
  const remainingDailyDetailBudget = Math.max(
    0,
    (params.dailyDetailBudget ?? CATALOG_SYNC_DEFAULT_DAILY_DETAIL_BUDGET) -
      params.recentDetailRequestsUsed,
  );
  const listRequestBudget = Math.min(
    params.perRunListBudget ?? CATALOG_SYNC_DEFAULT_LIST_BUDGET_PER_RUN,
    remainingDailyListBudget,
  );

  if (listRequestBudget <= 0) {
    return {
      listRequestBudget: 0,
      detailCandidateBudget: remainingDailyDetailBudget,
      tasks: [],
    } satisfies CatalogSyncPlan;
  }

  const dueSlices = params.slices
    .filter((slice) => slice.enabled && isSliceDue(slice, now))
    .sort(compareSlicesForExecution);

  const tasks: CatalogSyncTask[] = [];
  let remainingListBudget = listRequestBudget;

  for (const slice of dueSlices) {
    if (remainingListBudget <= 0) {
      break;
    }

    const pageCount = Math.min(slice.pageBudgetPerRun, remainingListBudget);
    const pages = Array.from(
      { length: pageCount },
      (_, index) => slice.nextPage + index,
    );

    tasks.push({
      slice,
      pages,
    });
    remainingListBudget -= pageCount;
  }

  return {
    listRequestBudget,
    detailCandidateBudget: remainingDailyDetailBudget,
    tasks,
  } satisfies CatalogSyncPlan;
}

function isSliceDue(slice: CatalogSyncSliceRecord, now: Date) {
  if (!slice.lastRunAt) {
    return true;
  }

  const lastRunAt = new Date(slice.lastRunAt);
  if (Number.isNaN(lastRunAt.getTime())) {
    return true;
  }

  return (
    now.getTime() - lastRunAt.getTime() >= slice.cadenceHours * 60 * 60 * 1000
  );
}

function compareSlicesForExecution(
  left: CatalogSyncSliceRecord,
  right: CatalogSyncSliceRecord,
) {
  const leftLastSuccess = left.lastSuccessAt
    ? Date.parse(left.lastSuccessAt)
    : 0;
  const rightLastSuccess = right.lastSuccessAt
    ? Date.parse(right.lastSuccessAt)
    : 0;

  if (left.priority !== right.priority) {
    return right.priority - left.priority;
  }

  if (leftLastSuccess !== rightLastSuccess) {
    return leftLastSuccess - rightLastSuccess;
  }

  return left.key.localeCompare(right.key);
}
