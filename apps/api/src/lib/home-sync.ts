import type {
  enrichTitleSummaries as enrichTitleSummariesFn,
  upsertTitleSummaries as upsertTitleSummariesFn,
} from "./search/data";

import { fetchRawgDiscoveryResults } from "./rawg";
import {
  buildHomeSyncCandidateGroups,
  mergeUniqueTitleSummaries,
  type HomeSyncCandidateGroup,
} from "./home-sync-plan";

export type HomeSyncResult = {
  readonly runDate: string;
  readonly candidateCounts: Record<HomeSyncCandidateGroup["key"], number>;
  readonly uniqueCandidateCount: number;
  readonly enrichedCandidateCount: number;
};

export interface SyncHomeDiscoveryOptions {
  readonly rawgApiKey: string;
  readonly runDate?: string;
}

interface HomeSyncDependencies {
  readonly fetchDiscoveryResults: typeof fetchRawgDiscoveryResults;
  readonly upsertSummaries: typeof upsertTitleSummariesFn;
  readonly enrichSummaries: typeof enrichTitleSummariesFn;
}

export async function syncHomeDiscovery({
  rawgApiKey,
  runDate = toIsoDate(new Date()),
}: SyncHomeDiscoveryOptions, dependencies?: HomeSyncDependencies) {
  if (!rawgApiKey) {
    throw new Error("RAWG_API_KEY is required for home discovery sync.");
  }

  const resolvedDependencies = dependencies ?? (await loadDefaultDependencies());
  const groups = buildHomeSyncCandidateGroups(runDate);
  const results = await Promise.all(
    groups.map(async (group) => ({
      key: group.key,
      results: await resolvedDependencies.fetchDiscoveryResults({
        rawgApiKey,
        pageSize: group.pageSize,
        ordering: group.ordering,
        dates: group.dates,
      }),
    })),
  );

  const candidateCounts = {
    upcoming: 0,
    latest: 0,
    popular: 0,
  } satisfies Record<HomeSyncCandidateGroup["key"], number>;

  for (const result of results) {
    candidateCounts[result.key] = result.results.length;
  }

  const mergedCandidates = mergeUniqueTitleSummaries(
    results.map((result) => result.results),
  );

  await resolvedDependencies.upsertSummaries(mergedCandidates);
  const enrichedCandidates = await resolvedDependencies.enrichSummaries({
    summaries: mergedCandidates,
    rawgApiKey,
  });

  return {
    runDate,
    candidateCounts,
    uniqueCandidateCount: mergedCandidates.length,
    enrichedCandidateCount: enrichedCandidates,
  } satisfies HomeSyncResult;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function loadDefaultDependencies(): Promise<HomeSyncDependencies> {
  const { enrichTitleSummaries, upsertTitleSummaries } = await import(
    "./search/data"
  );

  return {
    fetchDiscoveryResults: fetchRawgDiscoveryResults,
    upsertSummaries: upsertTitleSummaries,
    enrichSummaries: enrichTitleSummaries,
  };
}
