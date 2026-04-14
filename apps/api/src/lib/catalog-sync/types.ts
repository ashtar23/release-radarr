import type { TitleSummary } from "@repo/types";

export type CatalogSliceFamily =
  | "upcoming_by_platform"
  | "recent_by_platform"
  | "popular_by_platform"
  | "popular_by_genre";

export type CatalogSliceParams = {
  ordering: string;
  dateWindow: {
    startOffsetDays: number;
    endOffsetDays: number;
  };
  platforms?: number[];
  genres?: number[];
  metacritic?: {
    min: number;
    max: number;
  };
};

export type CatalogSliceConfig = {
  key: string;
  family: CatalogSliceFamily;
  enabled: boolean;
  priority: number;
  cadenceHours: number;
  pageBudgetPerRun: number;
  params: CatalogSliceParams;
};

export type CatalogSyncSliceRecord = {
  key: string;
  family: CatalogSliceFamily;
  enabled: boolean;
  priority: number;
  paramsJson: CatalogSliceParams;
  pageBudgetPerRun: number;
  cadenceHours: number;
  nextPage: number;
  failureCount: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastStatus: string | null;
  lastFetchedCount: number;
  lastUpsertedCount: number;
};

export type CatalogSyncTask = {
  slice: CatalogSyncSliceRecord;
  pages: number[];
};

export type CatalogSyncPlan = {
  listRequestBudget: number;
  detailCandidateBudget: number;
  tasks: CatalogSyncTask[];
};

export type CatalogSyncRunRecord = {
  id: string;
  startedAt: string;
  status: "running" | "completed" | "failed";
};

export type CatalogSyncRunSummary = {
  runId: string;
  status: "completed" | "failed";
  listRequestsUsed: number;
  detailCandidatesSelected: number;
  fetchedCount: number;
  uniqueCount: number;
  upsertedCount: number;
  enrichedCount: number;
  executedSliceCount: number;
};

export type CatalogFetchResult = {
  totalCount: number | null;
  results: TitleSummary[];
};

export type CatalogSyncDependencies = {
  fetchCatalogResults: (params: {
    rawgApiKey: string;
    pageSize: number;
    page: number;
    ordering?: string;
    dates?: string;
    platforms?: number[];
    genres?: number[];
    metacritic?: { min: number; max: number };
  }) => Promise<CatalogFetchResult>;
  upsertSummaries: (summaries: TitleSummary[]) => Promise<void>;
  enrichSummaries: (params: {
    summaries: TitleSummary[];
    rawgApiKey: string;
    limit?: number;
  }) => Promise<number>;
};
