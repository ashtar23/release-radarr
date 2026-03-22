import { DETAIL_FRESHNESS_HOURS, SEARCH_FRESHNESS_DAYS } from "../config.ts";
import type { CachedTitleRow, LocalSearchResult } from "../types.ts";

export function areSearchResultsStale(results: LocalSearchResult[]) {
  if (!results.length) return true;
  return getSearchStaleRatio(results) >= 1;
}

export function getSearchStaleRatio(results: LocalSearchResult[]) {
  if (!results.length) {
    return 1;
  }

  const cutoff = Date.now() - SEARCH_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
  const staleCount = results.reduce((count, result) => {
    const timestamp = Date.parse(result.searchUpdatedAt);
    if (!Number.isFinite(timestamp) || timestamp < cutoff) {
      return count + 1;
    }

    return count;
  }, 0);

  return staleCount / results.length;
}

export function isDetailStale(row: CachedTitleRow) {
  if (!row.detail_updated_at) return true;
  const timestamp = Date.parse(row.detail_updated_at);
  if (!Number.isFinite(timestamp)) return true;

  const cutoff = Date.now() - DETAIL_FRESHNESS_HOURS * 60 * 60 * 1000;
  return timestamp < cutoff;
}
