import type { TitleSearchResult } from "@repo/types";

import { env } from "../env";
import { MIN_QUERY_LENGTH } from "./constants";
import {
  fetchLocalSearchResults,
  fetchProviderSearchCandidates,
  mergeUniqueResults,
  upsertProviderSearchResults,
} from "./data";
import {
  createSearchContext,
  normalizeLimit,
  normalizePage,
  normalizeSearchKey,
  tokenizeSearchKey,
} from "./normalize";
import { rankResults } from "./ranking";
import type { RankedSearchCandidate, SearchTitlesParams } from "./types";

export async function searchTitles(
  params: SearchTitlesParams,
): Promise<TitleSearchResult> {
  const trimmedQuery = params.query.trim();
  const normalizedQuery = normalizeSearchKey(trimmedQuery);
  const page = normalizePage(params.page);
  const limit = normalizeLimit(params.limit);

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return createEmptySearchResult(trimmedQuery, page, limit);
  }

  const queryTokens = tokenizeSearchKey(trimmedQuery);
  if (queryTokens.length === 0) {
    return createEmptySearchResult(trimmedQuery, page, limit);
  }

  const searchContext = createSearchContext(
    trimmedQuery,
    normalizedQuery,
    queryTokens,
  );
  const localSearch = await fetchLocalSearchResults({
    queryTokens,
    page,
    limit,
  });

  const rankedLocalResults = rankResults(localSearch.results, searchContext);
  const localPageResults = slicePage(rankedLocalResults, page, limit);

  if (!params.forceRefresh && localPageResults.length === limit) {
    return buildSearchResult({
      query: trimmedQuery,
      results: rankedLocalResults,
      totalCount: localSearch.totalCount,
      page,
      limit,
      servedBy: "local-cache",
      decisionReason: "local_sufficient",
    });
  }

  if (!env.rawgApiKey) {
    return buildSearchResult({
      query: trimmedQuery,
      results: rankedLocalResults,
      totalCount: localSearch.totalCount,
      page,
      limit,
      servedBy: "local-cache",
      decisionReason: "provider_missing_key",
    });
  }

  try {
    const providerSearch = await fetchProviderSearchCandidates({
      query: trimmedQuery,
      page,
      limit,
      rawgApiKey: env.rawgApiKey,
    });

    if (providerSearch.results.length === 0) {
      return buildSearchResult({
        query: trimmedQuery,
        results: rankedLocalResults,
        totalCount: localSearch.totalCount,
        page,
        limit,
        servedBy: "local-cache",
        decisionReason: params.forceRefresh
          ? "forced_refresh"
          : "sparse_broad_local",
      });
    }

    await upsertProviderSearchResults(
      providerSearch.results.map((result) => result.summary),
    );

    const mergedResults = rankResults(
      mergeUniqueResults(rankedLocalResults, providerSearch.results),
      searchContext,
    );

    return buildSearchResult({
      query: trimmedQuery,
      results: mergedResults,
      totalCount: Math.max(
        localSearch.totalCount,
        providerSearch.totalCount ?? 0,
        mergedResults.length,
      ),
      page,
      limit,
      servedBy: "rawg-refresh",
      decisionReason: params.forceRefresh ? "forced_refresh" : "provider_used",
      providerUsedTrigger: params.forceRefresh
        ? localPageResults.length === limit
          ? "freshness"
          : "coverage_and_freshness"
        : "coverage",
    });
  } catch {
    return buildSearchResult({
      query: trimmedQuery,
      results: rankedLocalResults,
      totalCount: localSearch.totalCount,
      page,
      limit,
      servedBy: "local-cache",
      decisionReason: "provider_fetch_failed",
    });
  }
}

function buildSearchResult(params: {
  query: string;
  results: RankedSearchCandidate[];
  totalCount: number;
  page: number;
  limit: number;
  servedBy: "local-cache" | "rawg-refresh";
  decisionReason:
    | "forced_refresh"
    | "local_sufficient"
    | "provider_fetch_failed"
    | "provider_missing_key"
    | "provider_used"
    | "sparse_broad_local";
  providerUsedTrigger?: "coverage" | "coverage_and_freshness" | "freshness";
}): TitleSearchResult {
  const pageResults = slicePage(params.results, params.page, params.limit).map(
    (result) => result.summary,
  );

  return {
    query: params.query,
    results: pageResults,
    totalCount: params.totalCount,
    page: params.page,
    limit: params.limit,
    hasMore: params.totalCount > params.page * params.limit,
    servedBy: params.servedBy,
    decisionReason: params.decisionReason,
    providerUsedTrigger: params.providerUsedTrigger,
  };
}

function createEmptySearchResult(
  query: string,
  page: number,
  limit: number,
): TitleSearchResult {
  return {
    query,
    results: [],
    totalCount: 0,
    page,
    limit,
    hasMore: false,
    servedBy: "local-cache",
  };
}

function slicePage(
  results: RankedSearchCandidate[],
  page: number,
  limit: number,
) {
  const start = (page - 1) * limit;
  return results.slice(start, start + limit);
}
