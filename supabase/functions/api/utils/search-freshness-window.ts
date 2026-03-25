import type { QueryIntentMode } from "../contracts/search.ts";
import type { LocalSearchResult } from "../types.ts";
import { getSearchStaleRatio } from "./freshness.ts";
import { mergeResults } from "./search-ranking.ts";

export function getRelevantLocalStaleRatio(
  localResults: LocalSearchResult[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
  rankedPageResultIds?: string[],
) {
  const sample = getRelevantLocalFreshnessWindow(
    localResults,
    query,
    intentMode,
    page,
    limit,
    rankedPageResultIds,
  );
  return getSearchStaleRatio(sample);
}

export function getRelevantLocalFreshnessWindow(
  localResults: LocalSearchResult[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
  rankedPageResultIds?: string[],
) {
  if (localResults.length <= limit) {
    return localResults;
  }

  const sampleStart = Math.max(0, (page - 1) * limit);
  const sampleEnd = sampleStart + limit;
  const pageResultIds = rankedPageResultIds ??
    mergeResults(
      localResults.map((result) => result.summary),
      [],
      query,
      intentMode,
      page,
      limit,
    ).rankedPageResultIds;

  if (pageResultIds.length > 0) {
    const resultById = new Map(
      localResults.map((result) => [result.summary.id, result]),
    );
    const sampledResults = pageResultIds.flatMap((id) => {
      const localResult = resultById.get(id);
      return localResult ? [localResult] : [];
    });

    if (sampledResults.length > 0) {
      return sampledResults;
    }
  }

  return localResults.slice(sampleStart, sampleEnd);
}
