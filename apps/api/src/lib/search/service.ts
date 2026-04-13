import { env } from "../env";
import type { TitleSearchResult } from "../contracts";
import { MIN_QUERY_LENGTH } from "./constants";
import {
  enrichProviderSearchResults,
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
import { decideSearchExecution } from "./policy";
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
    normalizedQuery,
    queryTokens,
    intentMode: searchContext.intentMode,
    page,
    limit,
  });

  const rankedLocalResults = rankResults(localSearch.results, searchContext);
  const executionDecision = decideSearchExecution({
    rankedLocalResults,
    context: searchContext,
    page,
    limit,
    forceRefresh: params.forceRefresh,
  });

  if (executionDecision.kind === "local") {
    return buildSearchResult({
      query: trimmedQuery,
      results: rankedLocalResults,
      totalCount: localSearch.totalCount,
      page,
      limit,
      servedBy: "local-cache",
      decisionReason: executionDecision.decisionReason,
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

  const providerRefresh = await resolveProviderRefresh({
    query: trimmedQuery,
    localResults: rankedLocalResults,
    localTotalCount: localSearch.totalCount,
    context: searchContext,
    page,
    limit,
    forceRefresh: params.forceRefresh,
    providerUsedTrigger: executionDecision.providerUsedTrigger,
    rawgApiKey: env.rawgApiKey,
  });

  return buildSearchResult({
    query: trimmedQuery,
    results: providerRefresh.results,
    totalCount: providerRefresh.totalCount,
    page,
    limit,
    servedBy: providerRefresh.servedBy,
    decisionReason: providerRefresh.decisionReason,
    providerUsedTrigger: providerRefresh.providerUsedTrigger,
  });
}

type ResolveProviderRefreshParams = {
  query: string;
  localResults: RankedSearchCandidate[];
  localTotalCount: number;
  context: Parameters<typeof rankResults>[1];
  page: number;
  limit: number;
  forceRefresh: boolean;
  providerUsedTrigger: "coverage" | "coverage_and_freshness" | "freshness";
  rawgApiKey: string;
  deps?: {
    fetchProviderSearchCandidates: typeof fetchProviderSearchCandidates;
    upsertProviderSearchResults: typeof upsertProviderSearchResults;
    enrichProviderSearchResults: typeof enrichProviderSearchResults;
    mergeUniqueResults: typeof mergeUniqueResults;
    rankResults: typeof rankResults;
    logProviderRefreshFailure: typeof logProviderRefreshFailure;
  };
};

type ProviderRefreshResolution = {
  results: RankedSearchCandidate[];
  totalCount: number;
  servedBy: "local-cache" | "rawg-refresh";
  decisionReason:
    | "forced_refresh"
    | "provider_fetch_failed"
    | "provider_used"
    | "sparse_broad_local";
  providerUsedTrigger?: "coverage" | "coverage_and_freshness" | "freshness";
};

export async function resolveProviderRefresh(
  params: ResolveProviderRefreshParams,
): Promise<ProviderRefreshResolution> {
  const deps = {
    fetchProviderSearchCandidates,
    upsertProviderSearchResults,
    enrichProviderSearchResults,
    mergeUniqueResults,
    rankResults,
    logProviderRefreshFailure,
    ...params.deps,
  };

  let providerSearch;
  try {
    providerSearch = await deps.fetchProviderSearchCandidates({
      query: params.query,
      page: params.page,
      limit: params.limit,
      rawgApiKey: params.rawgApiKey,
    });
  } catch (error) {
    deps.logProviderRefreshFailure("fetch", params.query, error);

    return {
      results: params.localResults,
      totalCount: params.localTotalCount,
      servedBy: "local-cache",
      decisionReason: "provider_fetch_failed",
    };
  }

  if (providerSearch.results.length === 0) {
    return {
      results: params.localResults,
      totalCount: params.localTotalCount,
      servedBy: "local-cache",
      decisionReason: params.forceRefresh
        ? "forced_refresh"
        : "sparse_broad_local",
    };
  }

  try {
    await deps.upsertProviderSearchResults(
      providerSearch.results.map((result) => result.summary),
    );
  } catch (error) {
    deps.logProviderRefreshFailure("upsert", params.query, error);
  }

  void deps
    .enrichProviderSearchResults({
      results: providerSearch.results,
      rawgApiKey: params.rawgApiKey,
    })
    .catch((error: unknown) => {
      deps.logProviderRefreshFailure("enrich", params.query, error);
    });

  const mergedResults = deps.rankResults(
    deps.mergeUniqueResults(params.localResults, providerSearch.results),
    params.context,
  );

  return {
    results: mergedResults,
    totalCount: Math.max(
      params.localTotalCount,
      providerSearch.totalCount ?? 0,
      mergedResults.length,
    ),
    servedBy: "rawg-refresh",
    decisionReason: params.forceRefresh ? "forced_refresh" : "provider_used",
    providerUsedTrigger: params.providerUsedTrigger,
  };
}

function logProviderRefreshFailure(
  step: "fetch" | "upsert" | "enrich",
  query: string,
  error: unknown,
) {
  console.error("Search provider refresh failed.", {
    step,
    query,
    error,
  });
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
