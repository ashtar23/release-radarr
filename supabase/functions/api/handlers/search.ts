import {
  getSearchLocalCountMode,
  getSearchMaxStaleRatio,
  isSearchTimingDebugEnabled,
  MIN_QUERY_LENGTH,
  type SearchLocalCountMode,
} from "../config.ts";
import {
  countLocalResults,
  findLocalResultsPage,
  upsertSearchResults,
} from "../data/titles-repository.ts";
import type {
  SearchDecisionReason,
  SearchProviderUsedTrigger,
  SearchServedBy,
} from "../contracts/search.ts";
import type { AdminClient, TitleSummary } from "../types.ts";
import { jsonResponse } from "../utils/http.ts";
import { evaluateSearchFallbackPolicy } from "../utils/search-fallback-policy.ts";
import { getRelevantLocalStaleRatio } from "../utils/search-freshness-window.ts";
import { tryFetchRawgSearchResultsWithBudget } from "../utils/search-provider-fetch.ts";
import {
  getMinLocalResultsBeforeFallback,
  getMinLocalPageCoverage,
  getProviderDecisionReason,
  getProviderPageBudget,
  getProviderUsedTrigger,
  isBroadSparseFreshLocalSufficient,
  isSparseBroadFirstPageLocal,
  shouldServeLocalResults,
} from "../utils/search-provider-policy.ts";
import {
  createSearchQueryContext,
  getProviderSearchQuery,
  getSearchQueryVariants,
  inferQuerySearchOptions,
  isTruthyFlag,
} from "../utils/search-query.ts";
import {
  dedupeById,
  isAnticipationProtected,
  mergeResults,
} from "../utils/search-ranking.ts";
import { clampLimit, clampPage } from "../utils/values.ts";

export async function handleSearchRequest(client: AdminClient, url: URL) {
  const query = url.searchParams.get("query")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return jsonResponse(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
      400,
    );
  }

  const limit = clampLimit(url.searchParams.get("limit"));
  const page = clampPage(url.searchParams.get("page"));
  const forceRefresh = isTruthyFlag(url.searchParams.get("forceRefresh"));

  const queryContext = createSearchQueryContext(query);
  const searchOptions = inferQuerySearchOptions(
    query,
    queryContext.queryTokens,
  );
  const queryVariants = getSearchQueryVariants(query);
  const providerQuery = getProviderSearchQuery(query);
  const requestStartedAt = performance.now();
  const maxStaleRatio = getSearchMaxStaleRatio();
  const minLocalPageCoverage = getMinLocalPageCoverage(
    searchOptions.intentMode,
    page,
  );
  const timings: SearchStageTimings = {
    localFetchMs: 0,
    localCountMs: 0,
    rankMs: 0,
    providerFetchMs: 0,
    upsertMs: 0,
  };
  let localCountModeUsed: SearchLocalCountMode | "inferred" = "exact";
  let localCountFallbackUsed = false;

  const localFetchStartedAt = performance.now();
  const localPage = await findLocalResultsPage(
    client,
    queryVariants,
    page,
    limit,
  );
  timings.localFetchMs = performance.now() - localFetchStartedAt;
  const localResults = localPage.results;
  const localSummaries = localResults.map((result) => result.summary);

  const canInferExactLocalTotal = localResults.length < localPage.candidateSize;
  const localCountStartedAt = canInferExactLocalTotal ? 0 : performance.now();
  const configuredLocalCountMode = getSearchLocalCountMode(page);
  localCountModeUsed = canInferExactLocalTotal
    ? "inferred"
    : configuredLocalCountMode;
  const localTotalCountPromise = canInferExactLocalTotal
    ? Promise.resolve(localResults.length)
    : countLocalResults(client, queryVariants, configuredLocalCountMode);

  const localRankStartedAt = performance.now();

  // Evaluate fallback using the same ranked/denoised local page shape that users
  // actually see, not the raw candidate pool size.
  const mergedLocalResults = mergeResults(
    localSummaries,
    [],
    query,
    searchOptions.intentMode,
    page,
    limit,
    queryContext,
  );
  const localStaleRatio = getRelevantLocalStaleRatio(
    localResults,
    query,
    searchOptions.intentMode,
    page,
    limit,
    mergedLocalResults.rankedPageResultIds,
  );
  timings.rankMs += performance.now() - localRankStartedAt;

  const localCountResolution = await resolveLocalTotalCount(
    localTotalCountPromise,
    queryVariants,
    page,
    limit,
    localSummaries.length,
  );
  timings.localCountMs = canInferExactLocalTotal
    ? 0
    : performance.now() - localCountStartedAt;
  localCountFallbackUsed = localCountResolution.usedFallback;
  const localTotalCount = localCountResolution.totalCount;

  const hasProtectedBroadLocalHead =
    searchOptions.intentMode === "broad" &&
    page === 1 &&
    mergedLocalResults.results.some((result) =>
      isAnticipationProtected(result),
    );
  const sparseBroadFirstPageLocal = isSparseBroadFirstPageLocal(
    searchOptions.intentMode,
    page,
    mergedLocalResults.results.length,
    localTotalCount,
    hasProtectedBroadLocalHead,
  );

  const policy = evaluateSearchFallbackPolicy({
    localPageCount: mergedLocalResults.results.length,
    localTotalCount,
    staleRatio: localStaleRatio,
    page,
    limit,
    minLocalResultsBeforeFallback: getMinLocalResultsBeforeFallback(
      searchOptions.intentMode,
      page,
    ),
    minLocalPageCoverage,
    maxStaleRatio,
  });
  const broadProtectedHeadIsFresh =
    hasProtectedBroadLocalHead && localStaleRatio <= maxStaleRatio;
  const broadSparseFreshLocalSufficient = isBroadSparseFreshLocalSufficient(
    searchOptions.intentMode,
    page,
    sparseBroadFirstPageLocal,
    mergedLocalResults.results.length,
    localStaleRatio,
  );

  const returnResults = (
    results: TitleSummary[],
    totalCount: number,
    servedBy: SearchServedBy,
    hasMoreOverride?: boolean,
    decisionReason?: SearchDecisionReason,
    providerUsedTrigger?: SearchProviderUsedTrigger,
  ) => {
    logSearchStageTimingsIfEnabled({
      query,
      page,
      limit,
      servedBy,
      decisionReason,
      providerUsedTrigger,
      requestMs: performance.now() - requestStartedAt,
      localFetchMs: timings.localFetchMs,
      localCountMs: timings.localCountMs,
      rankMs: timings.rankMs,
      providerFetchMs: timings.providerFetchMs,
      upsertMs: timings.upsertMs,
      localCountMode: localCountModeUsed,
      localCountFallbackUsed,
    });

    return jsonResponse({
      query,
      results,
      totalCount,
      page,
      limit,
      hasMore: hasMoreOverride ?? page * limit < totalCount,
      servedBy,
      decisionReason,
      providerUsedTrigger,
    });
  };

  const returnLocalResults = (decisionReason: SearchDecisionReason) => {
    if (mergedLocalResults.relevanceExhausted) {
      const totalCount = (page - 1) * limit + mergedLocalResults.results.length;
      return returnResults(
        mergedLocalResults.results,
        totalCount,
        "local-cache",
        false,
        decisionReason,
      );
    }

    const totalCount = Math.max(
      localTotalCount,
      (page - 1) * limit + mergedLocalResults.results.length,
    );
    return returnResults(
      mergedLocalResults.results,
      totalCount,
      "local-cache",
      undefined,
      decisionReason,
    );
  };

  if (
    shouldServeLocalResults(
      forceRefresh,
      policy.needsProvider,
      broadProtectedHeadIsFresh,
      broadSparseFreshLocalSufficient,
    )
  ) {
    return returnLocalResults("local_sufficient");
  }

  const providerDecisionReason = getProviderDecisionReason(
    forceRefresh,
    sparseBroadFirstPageLocal,
  );
  const providerUsedTrigger =
    providerDecisionReason === "provider_used"
      ? getProviderUsedTrigger(policy)
      : undefined;
  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    return returnLocalResults("provider_missing_key");
  }

  const providerPageBudget = getProviderPageBudget(sparseBroadFirstPageLocal);
  const providerFetchStartedAt = performance.now();
  const rawgPage = await tryFetchRawgSearchResultsWithBudget(
    providerQuery,
    page,
    limit,
    searchOptions.precise,
    searchOptions.exact,
    rawgApiKey,
    providerPageBudget,
  );
  timings.providerFetchMs = performance.now() - providerFetchStartedAt;
  if (!rawgPage) {
    return returnLocalResults("provider_fetch_failed");
  }

  const dedupedRawgResults = dedupeById(rawgPage.results);
  const now = new Date().toISOString();
  const upsertStartedAt = performance.now();
  const upsertPromise =
    dedupedRawgResults.length > 0
      ? upsertSearchResults(client, dedupedRawgResults, now).then((result) => {
          timings.upsertMs = performance.now() - upsertStartedAt;
          return result;
        })
      : Promise.resolve<string | null>(null);
  if (dedupedRawgResults.length === 0) {
    timings.upsertMs = 0;
  }

  // Overlap cache write with ranking/merge work to reduce end-to-end latency.
  const providerRankStartedAt = performance.now();
  const mergedResults = mergeResults(
    localSummaries,
    dedupedRawgResults,
    query,
    searchOptions.intentMode,
    page,
    limit,
    queryContext,
  );
  timings.rankMs += performance.now() - providerRankStartedAt;

  const upsertErrorMessage = await upsertPromise;
  if (upsertErrorMessage) {
    console.error(
      "Search cache upsert failed; serving RAWG page without cache write.",
      {
        query,
        page,
        limit,
        errorMessage: upsertErrorMessage,
      },
    );
  }

  if (mergedResults.relevanceExhausted) {
    const totalCount = (page - 1) * limit + mergedResults.results.length;
    return returnResults(
      mergedResults.results,
      totalCount,
      "rawg-refresh",
      false,
      providerDecisionReason,
      providerUsedTrigger,
    );
  }

  const totalCount = Math.max(
    rawgPage.totalCount ?? localTotalCount,
    (page - 1) * limit + mergedResults.results.length,
  );
  return returnResults(
    mergedResults.results,
    totalCount,
    "rawg-refresh",
    undefined,
    providerDecisionReason,
    providerUsedTrigger,
  );
}

async function resolveLocalTotalCount(
  localTotalCountPromise: Promise<number>,
  queryVariants: string[],
  page: number,
  limit: number,
  localPageCount: number,
) {
  try {
    return {
      totalCount: await localTotalCountPromise,
      usedFallback: false,
    };
  } catch (error) {
    // If counting fails, degrade gracefully using a lower-bound total.
    console.error("Local search count failed; using lower-bound total.", {
      query: queryVariants.join(" | "),
      page,
      limit,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      totalCount: (page - 1) * limit + localPageCount,
      usedFallback: true,
    };
  }
}

interface SearchStageTimings {
  localFetchMs: number;
  localCountMs: number;
  rankMs: number;
  providerFetchMs: number;
  upsertMs: number;
}

interface SearchStageTimingLogPayload extends SearchStageTimings {
  query: string;
  page: number;
  limit: number;
  servedBy: SearchServedBy;
  decisionReason?: SearchDecisionReason;
  providerUsedTrigger?: SearchProviderUsedTrigger;
  requestMs: number;
  localCountMode: SearchLocalCountMode | "inferred";
  localCountFallbackUsed: boolean;
}

function logSearchStageTimingsIfEnabled(payload: SearchStageTimingLogPayload) {
  if (!isSearchTimingDebugEnabled()) {
    return;
  }

  const roundedPayload = {
    ...payload,
    requestMs: roundMilliseconds(payload.requestMs),
    localFetchMs: roundMilliseconds(payload.localFetchMs),
    localCountMs: roundMilliseconds(payload.localCountMs),
    rankMs: roundMilliseconds(payload.rankMs),
    providerFetchMs: roundMilliseconds(payload.providerFetchMs),
    upsertMs: roundMilliseconds(payload.upsertMs),
  };

  console.info(`[search-timing] ${JSON.stringify(roundedPayload)}`);
}

function roundMilliseconds(value: number) {
  return Math.round(value * 100) / 100;
}
