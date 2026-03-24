import {
  MAX_STALE_RATIO,
  MIN_LOCAL_RESULTS_BEFORE_FALLBACK,
  MIN_LOCAL_PAGE_COVERAGE,
  MIN_QUERY_LENGTH,
  isSearchBroadDenoiseEnabled,
  isSearchRankingV2Enabled,
} from "../config.ts";
import {
  countLocalResults,
  findLocalResultsPage,
  upsertSearchResults,
} from "../data/titles-repository.ts";
import { fetchRawgSearchResults } from "../providers/rawg.ts";
import type {
  AdminClient,
  LocalSearchResult,
  RawgSearchPage,
  SearchDecisionReason,
  TitleSummary,
} from "../types.ts";
import { getSearchStaleRatio } from "../utils/freshness.ts";
import { jsonResponse } from "../utils/http.ts";
import {
  computeProviderQualityAdjustment,
  computeProviderQualityAdjustmentV2,
  computeProviderQualityComposite,
  type LexicalConfidence,
} from "../utils/provider-quality.ts";
import {
  expandNormalizedQueryVariants,
  normalizeSearchKey,
  toCanonicalSearchKey,
  tokenizeSearchKey,
  toLooseComparableTokens,
} from "../utils/search-normalization.ts";
import { evaluateSearchFallbackPolicy } from "../utils/search-fallback-policy.ts";
import { clampLimit, clampPage } from "../utils/values.ts";

type QueryIntentMode = "broad" | "specific";
interface QuerySearchOptions {
  intentMode: QueryIntentMode;
  precise: boolean;
  exact: boolean;
}

const SPARSE_BROAD_PROVIDER_MAX_PAGES = 3;
const SPECIFIC_DERIVATIVE_TOP_WINDOW = 5;
const SPECIFIC_DERIVATIVE_TOP_CAP = 1;

export async function handleSearchRequest(client: AdminClient, url: URL) {
  const query = url.searchParams.get("query")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return jsonResponse(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
      400,
    );
  }

  const searchOptions = inferQuerySearchOptions(query);
  const queryVariants = getSearchQueryVariants(query);
  const providerQuery = getProviderSearchQuery(query);
  const limit = clampLimit(url.searchParams.get("limit"));
  const page = clampPage(url.searchParams.get("page"));
  const forceRefresh = isTruthyFlag(url.searchParams.get("forceRefresh"));
  const localPage = await findLocalResultsPage(
    client,
    queryVariants,
    page,
    limit,
  );
  const localResults = localPage.results;
  const localSummaries = localResults.map((result) => result.summary);
  const localTotalCount = await getLocalTotalCount(
    client,
    queryVariants,
    page,
    limit,
    localSummaries.length,
  );
  // Evaluate fallback using the same ranked/denoised local page shape that users
  // actually see, not the raw candidate pool size.
  const mergedLocalResults = mergeResults(
    localSummaries,
    [],
    query,
    searchOptions.intentMode,
    page,
    limit,
  );
  const localStaleRatio = getRelevantLocalStaleRatio(
    localResults,
    query,
    searchOptions.intentMode,
    page,
    limit,
  );
  const hasProtectedBroadLocalHead = searchOptions.intentMode === "broad" &&
    page === 1 &&
    mergedLocalResults.results.some((result) => isAnticipationProtected(result));
  const sparseBroadFirstPageLocal = isSparseBroadFirstPageLocal(
    searchOptions.intentMode,
    page,
    mergedLocalResults.results.length,
    localTotalCount,
    hasProtectedBroadLocalHead,
  );
  const providerPageBudget = getProviderPageBudget(sparseBroadFirstPageLocal);
  const returnResults = (
    results: TitleSummary[],
    totalCount: number,
    servedBy: "local-cache" | "rawg-refresh",
    hasMoreOverride?: boolean,
    decisionReason?: SearchDecisionReason,
  ) =>
    jsonResponse({
      query,
      results,
      totalCount,
      page,
      limit,
      hasMore: hasMoreOverride ?? page * limit < totalCount,
      servedBy,
      decisionReason,
    });
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

  const policy = evaluateSearchFallbackPolicy({
    localPageCount: mergedLocalResults.results.length,
    localTotalCount,
    staleRatio: localStaleRatio,
    page,
    limit,
    minLocalResultsBeforeFallback:
      searchOptions.intentMode === "broad" && page === 1
        ? MIN_LOCAL_RESULTS_BEFORE_FALLBACK
        : 1,
    minLocalPageCoverage: MIN_LOCAL_PAGE_COVERAGE,
    maxStaleRatio: MAX_STALE_RATIO,
  });
  const broadProtectedHeadIsFresh = hasProtectedBroadLocalHead &&
    localStaleRatio <= MAX_STALE_RATIO;
  const broadSparseFreshLocalSufficient = isBroadSparseFreshLocalSufficient(
    searchOptions.intentMode,
    page,
    sparseBroadFirstPageLocal,
    mergedLocalResults.results.length,
    localStaleRatio,
  );
  if (
    !forceRefresh &&
    (!policy.needsProvider || broadProtectedHeadIsFresh ||
      broadSparseFreshLocalSufficient)
  ) {
    return returnLocalResults("local_sufficient");
  }

  const providerDecisionReason = getProviderDecisionReason(
    forceRefresh,
    sparseBroadFirstPageLocal,
  );
  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    return returnLocalResults("provider_missing_key");
  }

  const rawgPage = await tryFetchRawgSearchResultsWithBudget(
    providerQuery,
    page,
    limit,
    searchOptions.precise,
    searchOptions.exact,
    rawgApiKey,
    providerPageBudget,
  );
  if (!rawgPage) {
    return returnLocalResults("provider_fetch_failed");
  }

  const dedupedRawgResults = dedupeById(rawgPage.results);
  const now = new Date().toISOString();
  if (dedupedRawgResults.length > 0) {
    const errorMessage = await upsertSearchResults(
      client,
      dedupedRawgResults,
      now,
    );

    if (errorMessage) {
      console.error(
        "Search cache upsert failed; serving RAWG page without cache write.",
        {
          query,
          page,
          limit,
          errorMessage,
        },
      );
    }
  }

  const mergedResults = mergeResults(
    localSummaries,
    dedupedRawgResults,
    query,
    searchOptions.intentMode,
    page,
    limit,
  );

  if (mergedResults.relevanceExhausted) {
    const totalCount = (page - 1) * limit + mergedResults.results.length;
    return returnResults(
      mergedResults.results,
      totalCount,
      "rawg-refresh",
      false,
      providerDecisionReason,
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
  );
}

async function tryFetchRawgSearchResults(
  query: string,
  page: number,
  limit: number,
  precise: boolean,
  exact: boolean,
  rawgApiKey: string,
): Promise<RawgSearchPage | null> {
  try {
    return await fetchRawgSearchResults(
      query,
      page,
      limit,
      precise,
      exact,
      rawgApiKey,
    );
  } catch {
    return null;
  }
}

async function tryFetchRawgSearchResultsWithBudget(
  query: string,
  page: number,
  limit: number,
  precise: boolean,
  exact: boolean,
  rawgApiKey: string,
  maxPages: number,
): Promise<RawgSearchPage | null> {
  const firstPage = await tryFetchRawgSearchResults(
    query,
    page,
    limit,
    precise,
    exact,
    rawgApiKey,
  );
  if (!firstPage) {
    return null;
  }

  if (maxPages <= 1) {
    return firstPage;
  }

  const aggregatedResults: TitleSummary[] = [...firstPage.results];
  let totalCount = firstPage.totalCount;

  for (let pageOffset = 1; pageOffset < maxPages; pageOffset += 1) {
    const nextPageNumber = page + pageOffset;
    if (
      typeof totalCount === "number" &&
      Number.isFinite(totalCount) &&
      (nextPageNumber - 1) * limit >= totalCount
    ) {
      break;
    }

    const nextPage = await tryFetchRawgSearchResults(
      query,
      nextPageNumber,
      limit,
      precise,
      exact,
      rawgApiKey,
    );
    if (!nextPage) {
      break;
    }

    if (
      typeof nextPage.totalCount === "number" &&
      Number.isFinite(nextPage.totalCount)
    ) {
      totalCount = typeof totalCount === "number"
        ? Math.max(totalCount, nextPage.totalCount)
        : nextPage.totalCount;
    }

    if (nextPage.results.length === 0) {
      break;
    }

    aggregatedResults.push(...nextPage.results);
  }

  return {
    totalCount,
    results: aggregatedResults,
  };
}

interface MergeResultsResult {
  results: TitleSummary[];
  relevanceExhausted: boolean;
}

function mergeResults(
  localResults: TitleSummary[],
  rawgResults: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
): MergeResultsResult {
  const dedupedResults = dedupeById([...rawgResults, ...localResults]);
  const rankedResults = rankResults(dedupedResults, query, intentMode);
  const queryTokens = tokenizeSearchKey(query);

  if (intentMode !== "specific") {
    const denoisedResults =
      isSearchBroadDenoiseEnabled() &&
        isSingleTokenFranchiseQuery(queryTokens, intentMode)
      ? applyBroadFranchiseDenoise(rankedResults, limit)
      : rankedResults;
    return {
      results: sliceRankedPage(denoisedResults, page, limit).map(
        (entry) => entry.result,
      ),
      relevanceExhausted: false,
    };
  }

  const denoised = applySpecificQueryDenoise(rankedResults, page, limit);
  return {
    results: sliceRankedPage(denoised.results, page, limit).map(
      (entry) => entry.result,
    ),
    relevanceExhausted: denoised.relevanceExhausted,
  };
}

function sliceRankedPage(
  results: RankedSearchResult[],
  page: number,
  limit: number,
) {
  const start = Math.max(0, (page - 1) * limit);
  return results.slice(start, start + limit);
}

function dedupeById(results: TitleSummary[]) {
  const deduped: TitleSummary[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (seenIds.has(result.id)) {
      continue;
    }

    seenIds.add(result.id);
    deduped.push(result);
  }

  return deduped;
}

interface RankedSearchResult {
  result: TitleSummary;
  score: number;
  coverage: number;
  exactMatch: boolean;
  includesExactQuery: boolean;
  extraTokenCount: number;
}

function rankResults(
  results: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  rankingV2Enabled = isSearchRankingV2Enabled(),
) {
  const normalizedQuery = toCanonicalSearchKey(query);
  const queryTokens = tokenizeSearchKey(query);
  const queryTokenSet = new Set(queryTokens);
  const ranked = results.map((result) =>
    scoreResult(
      result,
      normalizedQuery,
      queryTokens,
      queryTokenSet,
      intentMode,
      rankingV2Enabled,
    ),
  );
  const sorted = ranked.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const byName = left.result.name.localeCompare(right.result.name);
    if (byName !== 0) {
      return byName;
    }

    return left.result.id.localeCompare(right.result.id);
  });

  if (intentMode !== "specific") {
    return sorted;
  }

  return applySpecificDerivativeSubtitleCap(sorted, queryTokens);
}

function scoreResult(
  result: TitleSummary,
  normalizedQuery: string,
  queryTokens: string[],
  queryTokenSet: Set<string>,
  intentMode: QueryIntentMode,
  rankingV2Enabled: boolean,
): RankedSearchResult {
  const normalizedName = toCanonicalSearchKey(result.name);
  const nameTokens = tokenizeSearchKey(result.name);
  const looseQueryTokens = toLooseComparableTokens(queryTokens);
  const looseNameTokens = toLooseComparableTokens(nameTokens);
  const nameTokenSet = new Set(nameTokens);
  const looseNameTokenSet = new Set(looseNameTokens);
  const queryNumericTokens = extractNumericTokens(queryTokens);
  const matchedTokens = queryTokens.filter((token) =>
    nameTokenSet.has(token),
  ).length;
  const looseMatchedTokens = looseQueryTokens.filter((token) =>
    looseNameTokenSet.has(token),
  ).length;
  const effectiveMatchedTokens = Math.max(matchedTokens, looseMatchedTokens);
  const coverage =
    queryTokens.length > 0 ? effectiveMatchedTokens / queryTokens.length : 0;
  const looseNormalizedQuery = looseQueryTokens.join(" ");
  const looseNormalizedName = looseNameTokens.join(" ");
  const includesExactQuery =
    normalizedName.includes(normalizedQuery) ||
    (looseNormalizedQuery.length > 0 &&
      looseNormalizedName.includes(looseNormalizedQuery));
  const startsWithQuery =
    normalizedName.startsWith(normalizedQuery) ||
    stripLeadingArticle(normalizedName).startsWith(normalizedQuery) ||
    stripLeadingPossessivePrefix(normalizedName).startsWith(normalizedQuery) ||
    (looseNormalizedQuery.length > 0 &&
      (looseNormalizedName.startsWith(looseNormalizedQuery) ||
        stripLeadingArticle(looseNormalizedName).startsWith(
          looseNormalizedQuery,
        ) ||
        stripLeadingPossessivePrefix(looseNormalizedName).startsWith(
          looseNormalizedQuery,
        )));
  const exactMatch =
    normalizedName === normalizedQuery ||
    (looseNormalizedQuery.length > 0 &&
      looseNormalizedName === looseNormalizedQuery);
  const singleTokenFranchiseQuery = isSingleTokenFranchiseQuery(
    queryTokens,
    intentMode,
  );
  const exactMatchPoints = singleTokenFranchiseQuery ? 720 : 1200;
  const startsWithPoints = singleTokenFranchiseQuery ? 540 : 800;
  const includesPoints = singleTokenFranchiseQuery ? 300 : 350;

  let score = 0;

  if (exactMatch) score += exactMatchPoints;
  else if (startsWithQuery) score += startsWithPoints;
  else if (includesExactQuery) score += includesPoints;

  if (effectiveMatchedTokens === queryTokens.length && queryTokens.length > 0) {
    score += 320;
  }
  score += Math.round(coverage * 220);

  const extraTokenCount = nameTokens.filter(
    (token) => !queryTokenSet.has(token),
  ).length;
  const looseQueryTokenSet = new Set(looseQueryTokens);
  const looseExtraTokenCount = looseNameTokens.filter(
    (token) => !looseQueryTokenSet.has(token),
  ).length;
  if (extraTokenCount > 0) {
    score -=
      Math.min(Math.min(extraTokenCount, looseExtraTokenCount), 10) *
        (intentMode === "specific" ? 44 : 16);
  }

  const hasEditionSuffix =
    /(?:complete|edition|enhanced|game of the year|goty|remaster|definitive|director'?s cut|ultimate|bundle)\b/.test(
      normalizedName,
    );
  if (hasEditionSuffix) {
    score -= 90;
  } else {
    score += 40;
  }

  if (intentMode === "specific" && coverage < 0.5 && !includesExactQuery) {
    score -= 240;
  }
  score += computePlatformRelevanceAdjustment(
    result,
    queryTokenSet,
    intentMode,
  );
  score += computeNoisePenalty(result, queryTokenSet, queryTokens, intentMode);
  score += computeSpecificDerivativeSubtitlePenalty(
    result,
    intentMode,
    queryTokens,
    exactMatch,
    includesExactQuery,
    coverage,
    extraTokenCount,
  );
  score += computeSpecificMainlineSequelBoost(
    result,
    intentMode,
    queryTokens,
    includesExactQuery,
    coverage,
  );
  score += computeSingleTokenFranchiseAdjustment(
    result,
    normalizedName,
    normalizedQuery,
    singleTokenFranchiseQuery,
  );
  score += computeMetadataQualityAdjustment(result, intentMode);
  score += computeProviderQualityScore(
    result,
    intentMode,
    coverage,
    includesExactQuery,
    exactMatch,
    startsWithQuery,
    rankingV2Enabled,
  );
  score += computeBroadLowSignalAdjustment(
    result,
    intentMode,
    exactMatch,
    startsWithQuery,
  );
  score += computeBroadRecencyBoost(
    result,
    intentMode,
    coverage,
    includesExactQuery,
    exactMatch,
    startsWithQuery,
  );
  score += computeNumericIntentAdjustment(
    nameTokenSet,
    queryNumericTokens,
    intentMode,
  );

  return {
    result,
    score,
    coverage,
    exactMatch,
    includesExactQuery,
    extraTokenCount,
  };
}

interface DenoiseResults {
  results: RankedSearchResult[];
  relevanceExhausted: boolean;
}

function applySpecificQueryDenoise(
  results: RankedSearchResult[],
  page: number,
  limit: number,
): DenoiseResults {
  const strongMatches = results.filter(isStrongSpecificMatch);

  if (page === 1) {
    if (strongMatches.length >= Math.min(6, limit)) {
      return { results: strongMatches, relevanceExhausted: false };
    }

    return { results, relevanceExhausted: false };
  }

  const minimumStrongMatches = Math.max(2, Math.floor(limit * 0.2));
  if (strongMatches.length < minimumStrongMatches) {
    return {
      results: strongMatches,
      relevanceExhausted: true,
    };
  }

  return { results: strongMatches, relevanceExhausted: false };
}

function applyBroadFranchiseDenoise(
  results: RankedSearchResult[],
  limit: number,
) {
  const prunedResults = results.filter((result) =>
    !isLowQualityBroadFranchiseTail(result)
  );
  const minimumRetained = Math.min(3, limit);
  if (prunedResults.length >= minimumRetained && prunedResults.length < results.length) {
    return prunedResults;
  }

  return results;
}

function isStrongSpecificMatch(result: RankedSearchResult) {
  return (
    result.includesExactQuery || result.coverage >= 0.66 || result.score >= 720
  );
}

function isLowQualityBroadFranchiseTail(result: RankedSearchResult) {
  const qualityScore = computeProviderQualityComposite(result.result);
  const hasExtraTokens = result.extraTokenCount > 0;
  const ratingsCount = result.result.rawgRatingsCount ?? 0;
  const addedCount = result.result.rawgAdded ?? 0;
  const reviewsCount = result.result.rawgReviewsCount ?? 0;
  const veryLowEngagement =
    ratingsCount < 50 && addedCount < 250 && reviewsCount < 25;
  const lowQuality = qualityScore < 0.16;
  const highConfidenceLexicalAnchor =
    result.includesExactQuery && result.extraTokenCount === 0;

  if (highConfidenceLexicalAnchor) {
    return false;
  }

  if (isAnticipationProtected(result.result)) {
    return false;
  }

  if (veryLowEngagement && hasExtraTokens) {
    return true;
  }

  return lowQuality && hasExtraTokens;
}

function isAnticipationProtected(result: TitleSummary) {
  if (!hasMainstreamPlatform(result)) {
    return false;
  }

  // Upcoming mainstream titles can have low current engagement but should not
  // be dropped from broad franchise recall.
  if (isFutureReleaseDate(result.earliestReleaseDate)) {
    return true;
  }

  const hasStrongPopularitySignal =
    (result.rawgAdded ?? 0) >= 8000 || (result.rawgRatingsCount ?? 0) >= 1500;
  if (!hasStrongPopularitySignal) {
    return false;
  }

  return hasRecentMajorTitleSignal(result);
}

function isFutureReleaseDate(value: string | null) {
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) {
    return false;
  }

  return releaseDate.getTime() > Date.now();
}

function hasRecentMajorTitleSignal(result: TitleSummary) {
  const hasMajorQualitySignals =
    (result.rawgMetacritic ?? 0) >= 80 || (result.rawgRating ?? 0) >= 4.2;
  const hasMajorEngagementSignals =
    (result.rawgRatingsCount ?? 0) >= 1200 || (result.rawgAdded ?? 0) >= 7000;

  if (!hasMajorQualitySignals || !hasMajorEngagementSignals) {
    return false;
  }

  if (!result.earliestReleaseDate) {
    return true;
  }

  const releaseDate = parseReleaseDate(result.earliestReleaseDate);
  if (!releaseDate) {
    return true;
  }

  const eightYearsMs = 8 * 365 * 24 * 60 * 60 * 1000;
  return Date.now() - releaseDate.getTime() <= eightYearsMs;
}

function parseReleaseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const releaseDate = new Date(value);
  if (!Number.isFinite(releaseDate.getTime())) {
    return null;
  }

  return releaseDate;
}

function inferQuerySearchOptions(query: string): QuerySearchOptions {
  const tokens = tokenizeSearchKey(query);
  const hasNumericToken = tokens.some((token) => /^[0-9]+$/.test(token));
  const rawWordCount = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
  const hasMultipleWords = rawWordCount >= 2;

  const intentMode: QueryIntentMode =
    hasNumericToken || hasMultipleWords ? "specific" : "broad";

  return {
    intentMode,
    precise: intentMode === "specific",
    // RAWG exact matching is brittle for real-world title input
    // (diacritics, punctuation, alt naming). Favor recall + our ranking.
    exact: false,
  };
}

function extractNumericTokens(tokens: string[]) {
  return tokens.filter((token) => /^[0-9]+$/.test(token));
}

function computePlatformRelevanceAdjustment(
  result: TitleSummary,
  queryTokenSet: Set<string>,
  intentMode: QueryIntentMode,
) {
  const platformNames = result.platforms
    .map((platform) => platform.name.toLowerCase().trim())
    .filter((name) => name.length > 0);
  if (platformNames.length === 0) {
    return intentMode === "specific" ? -40 : -10;
  }

  const isWebOnly = platformNames.every(
    (name) => name.includes("web") || name.includes("browser"),
  );
  if (isWebOnly) {
    const querySignalsWebIntent =
      queryTokenSet.has("web") ||
      queryTokenSet.has("browser") ||
      queryTokenSet.has("html5") ||
      queryTokenSet.has("io");

    if (querySignalsWebIntent) {
      return intentMode === "specific" ? -40 : -10;
    }

    return intentMode === "specific" ? -520 : -220;
  }

  const hasMainstreamPlatform = platformNames.some(
    (name) =>
      name.includes("pc") ||
      name.includes("playstation") ||
      name.includes("xbox") ||
      name.includes("nintendo") ||
      name.includes("switch"),
  );

  if (hasMainstreamPlatform) {
    return 60;
  }

  return 0;
}

function computeNumericIntentAdjustment(
  nameTokenSet: Set<string>,
  queryNumericTokens: string[],
  intentMode: QueryIntentMode,
) {
  if (intentMode !== "specific" || queryNumericTokens.length === 0) {
    return 0;
  }

  const hasEveryRequestedNumber = queryNumericTokens.every((token) =>
    nameTokenSet.has(token),
  );
  if (!hasEveryRequestedNumber) {
    return -460;
  }

  const hasOtherNumbers = [...nameTokenSet].some(
    (token) => /^[0-9]+$/.test(token) && !queryNumericTokens.includes(token),
  );
  if (hasOtherNumbers) {
    return -120;
  }

  return 180;
}

function computeMetadataQualityAdjustment(
  result: TitleSummary,
  intentMode: QueryIntentMode,
) {
  let score = 0;

  if (result.earliestReleaseDate) {
    score += intentMode === "specific" ? 80 : 20;
  } else {
    score -= intentMode === "specific" ? 220 : 50;
  }

  const platformCount = result.platforms.length;
  if (platformCount === 0) {
    score -= intentMode === "specific" ? 140 : 30;
  } else if (platformCount === 1) {
    score -= intentMode === "specific" ? 60 : 10;
  } else {
    score += Math.min(platformCount * 28, 112);
  }

  if (result.coverImageUrl) {
    score += 12;
  } else {
    score -= 24;
  }

  return score;
}

function computeNoisePenalty(
  result: TitleSummary,
  queryTokenSet: Set<string>,
  queryTokens: string[],
  intentMode: QueryIntentMode,
) {
  const singleTokenFranchiseQuery = isSingleTokenFranchiseQuery(
    queryTokens,
    intentMode,
  );

  if (intentMode !== "specific" && !singleTokenFranchiseQuery) {
    return 0;
  }

  const normalizedName = normalizeSearchKey(result.name);
  const penalties: Array<{ keyword: string; points: number }> = [
    { keyword: "demo", points: -260 },
    { keyword: "mod", points: -220 },
    { keyword: "fan", points: -180 },
    { keyword: "test", points: -140 },
    { keyword: "prototype", points: -200 },
  ];
  if (singleTokenFranchiseQuery) {
    penalties.push(
      { keyword: "alpha", points: -260 },
      { keyword: "beta", points: -220 },
      { keyword: "simulator", points: -280 },
      { keyword: "demake", points: -260 },
      { keyword: "fangame", points: -240 },
      { keyword: "free roam", points: -180 },
      { keyword: "soft", points: -220 },
      { keyword: "android", points: -180 },
    );
  }

  let score = 0;
  for (const penalty of penalties) {
    if (
      normalizedName.includes(penalty.keyword) &&
      !queryTokenSet.has(penalty.keyword)
    ) {
      score += penalty.points;
    }
  }

  return score;
}

function computeSpecificDerivativeSubtitlePenalty(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  queryTokens: string[],
  exactMatch: boolean,
  includesExactQuery: boolean,
  coverage: number,
  extraTokenCount: number,
) {
  if (intentMode !== "specific") {
    return 0;
  }

  const derivativeEvaluation = evaluateSpecificDerivativeSubtitleResult(
    result,
    queryTokens,
    exactMatch,
    includesExactQuery,
    coverage,
  );
  if (!derivativeEvaluation?.shouldDemote) {
    return 0;
  }

  let penalty = -220;
  if (extraTokenCount >= 4) {
    penalty -= 60;
  }

  return penalty;
}

function computeSpecificMainlineSequelBoost(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  queryTokens: string[],
  includesExactQuery: boolean,
  coverage: number,
) {
  if (intentMode !== "specific") {
    return 0;
  }

  if (extractNumericTokens(queryTokens).length > 0) {
    return 0;
  }

  if (!includesExactQuery || coverage < 0.66) {
    return 0;
  }

  const looseQueryTokenSet = new Set(toLooseComparableTokens(queryTokens));
  if (queryHasDerivativeIntent(looseQueryTokenSet)) {
    return 0;
  }

  if (splitDerivativeSubtitle(result.name)) {
    return 0;
  }

  const primaryTokens = tokenizeSearchKey(result.name);
  const hasSequelNumber = primaryTokens.some((token) => /^[2-9][0-9]*$/.test(token));
  if (!hasSequelNumber) {
    return 0;
  }

  return 120;
}

function splitDerivativeSubtitle(name: string) {
  const match = name.match(/^(.+?)\s[-:]\s(.+)$/);
  if (!match) {
    return null;
  }

  const base = match[1]?.trim() ?? "";
  const subtitle = match[2]?.trim() ?? "";
  if (base.length === 0 || subtitle.length === 0) {
    return null;
  }

  return { base, subtitle };
}

function queryHasDerivativeIntent(queryTokens: Set<string>) {
  return (
    queryTokens.has("dlc") ||
    queryTokens.has("expansion") ||
    queryTokens.has("episode") ||
    queryTokens.has("chapter") ||
    (queryTokens.has("season") && queryTokens.has("pass")) ||
    (queryTokens.has("story") && queryTokens.has("pack")) ||
    queryTokens.has("addon") ||
    (queryTokens.has("add") && queryTokens.has("on")) ||
    queryTokens.has("bundle")
  );
}

interface SpecificDerivativeSubtitleEvaluation {
  queryMentionsSubtitle: boolean;
  capEligible: boolean;
  shouldDemote: boolean;
}

function evaluateSpecificDerivativeSubtitleResult(
  result: TitleSummary,
  queryTokens: string[],
  exactMatch: boolean,
  includesExactQuery: boolean,
  coverage: number,
): SpecificDerivativeSubtitleEvaluation | null {
  if (exactMatch) {
    return null;
  }

  if (!includesExactQuery && coverage < 0.66) {
    return null;
  }

  const subtitleParts = splitDerivativeSubtitle(result.name);
  if (!subtitleParts) {
    return null;
  }

  const baseTokens = tokenizeSearchKey(subtitleParts.base);
  const subtitleTokens = tokenizeSearchKey(subtitleParts.subtitle);
  if (baseTokens.length < 2 || subtitleTokens.length === 0) {
    return null;
  }

  const looseQueryTokens = toLooseComparableTokens(queryTokens);
  const looseBaseTokenSet = new Set(toLooseComparableTokens(baseTokens));
  const looseSubtitleTokenSet = new Set(toLooseComparableTokens(subtitleTokens));
  const looseQueryTokenSet = new Set(looseQueryTokens);
  const baseMatches = looseQueryTokens.filter((token) =>
    looseBaseTokenSet.has(token)
  ).length;
  const baseCoverage = queryTokens.length > 0 ? baseMatches / queryTokens.length : 0;
  if (baseCoverage < 0.66) {
    return null;
  }

  const queryMentionsSubtitle = [...looseQueryTokenSet].some((token) =>
    looseSubtitleTokenSet.has(token)
  );
  const qualityScore = computeProviderQualityComposite(result);
  const strongPopularitySignals =
    (result.rawgRatingsCount ?? 0) >= 4000 ||
    (result.rawgAdded ?? 0) >= 12000;
  const mainstreamSolidQuality = hasMainstreamPlatform(result) &&
    qualityScore >= 0.45;
  const qualityProtected = qualityScore >= 0.58 ||
    mainstreamSolidQuality ||
    strongPopularitySignals;
  const capEligible = !queryMentionsSubtitle &&
    !queryHasDerivativeIntent(looseQueryTokenSet);
  const shouldDemote = capEligible &&
    !qualityProtected;

  return {
    queryMentionsSubtitle,
    capEligible,
    shouldDemote,
  };
}

function applySpecificDerivativeSubtitleCap(
  results: RankedSearchResult[],
  queryTokens: string[],
) {
  if (results.length <= 1) {
    return results;
  }

  const derivativeEvaluations = results.map((entry) =>
    evaluateSpecificDerivativeSubtitleResult(
      entry.result,
      queryTokens,
      entry.exactMatch,
      entry.includesExactQuery,
      entry.coverage,
    )
  );
  const queryTargetsSpecificSubtitle = derivativeEvaluations.some((evaluation) =>
    evaluation?.queryMentionsSubtitle
  );
  if (queryTargetsSpecificSubtitle) {
    return results;
  }

  const topResults: RankedSearchResult[] = [];
  const remainder: RankedSearchResult[] = [];
  const deferredDerivativeEntries: RankedSearchResult[] = [];
  let derivativeCountInTopWindow = 0;

  for (let index = 0; index < results.length; index += 1) {
    const entry = results[index];
    const evaluation = derivativeEvaluations[index];

    if (topResults.length < SPECIFIC_DERIVATIVE_TOP_WINDOW) {
      const capEligibleDerivative = evaluation?.capEligible ?? false;
      if (
        capEligibleDerivative &&
        derivativeCountInTopWindow >= SPECIFIC_DERIVATIVE_TOP_CAP
      ) {
        deferredDerivativeEntries.push(entry);
        continue;
      }

      topResults.push(entry);
      if (capEligibleDerivative) {
        derivativeCountInTopWindow += 1;
      }
      continue;
    }

    remainder.push(entry);
  }

  if (deferredDerivativeEntries.length === 0) {
    return results;
  }

  return [...topResults, ...remainder, ...deferredDerivativeEntries];
}

function computeSingleTokenFranchiseAdjustment(
  result: TitleSummary,
  normalizedName: string,
  normalizedQuery: string,
  singleTokenFranchiseQuery: boolean,
) {
  if (!singleTokenFranchiseQuery) {
    return 0;
  }

  let score = 0;
  const brandedPrefixName = stripLeadingPossessivePrefix(normalizedName);
  const qualityScore = computeProviderQualityComposite(result);
  if (
    brandedPrefixName.startsWith(normalizedQuery) &&
    !normalizedName.startsWith(normalizedQuery)
  ) {
    score += 260;
  }

  if (qualityScore >= 0.55) {
    score += Math.round(qualityScore * 220);
  } else if (qualityScore <= 0.18) {
    score -= 180;
  }

  if (
    normalizedName === normalizedQuery &&
    qualityScore < 0.45 &&
    !hasMainstreamPlatform(result)
  ) {
    score -= 260;
  }

  if (/\([^)]*\)/.test(result.name)) {
    score -= 120;
  }

  return score;
}

export function rankResultsForTesting(
  results: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  rankingV2Enabled = true,
) {
  return rankResults(results, query, intentMode, rankingV2Enabled).map(
    (entry) => entry.result,
  );
}

export function getRelevantLocalStaleRatioForTesting(
  localResults: LocalSearchResult[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
) {
  return getRelevantLocalStaleRatio(
    localResults,
    query,
    intentMode,
    page,
    limit,
  );
}

export function getSearchQueryVariantsForTesting(query: string) {
  return getSearchQueryVariants(query);
}

export function getProviderSearchQueryForTesting(query: string) {
  return getProviderSearchQuery(query);
}

export function getLocalPolicyPageCountForTesting(
  localResults: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
) {
  return mergeResults(localResults, [], query, intentMode, page, limit).results
    .length;
}

export function getProviderPageBudgetForTesting(
  intentMode: QueryIntentMode,
  page: number,
  visibleLocalPageCount: number,
  localTotalCount: number,
  hasProtectedBroadLocalHead = false,
) {
  return getProviderPageBudget(
    isSparseBroadFirstPageLocal(
      intentMode,
      page,
      visibleLocalPageCount,
      localTotalCount,
      hasProtectedBroadLocalHead,
    ),
  );
}

export function getProviderDecisionReasonForTesting(
  forceRefresh: boolean,
  sparseBroadFirstPageLocal: boolean,
) {
  return getProviderDecisionReason(forceRefresh, sparseBroadFirstPageLocal);
}

export function getBroadSparseFreshLocalSufficientForTesting(
  intentMode: QueryIntentMode,
  page: number,
  sparseBroadFirstPageLocal: boolean,
  visibleLocalPageCount: number,
  localStaleRatio: number,
) {
  return isBroadSparseFreshLocalSufficient(
    intentMode,
    page,
    sparseBroadFirstPageLocal,
    visibleLocalPageCount,
    localStaleRatio,
  );
}

export function inferQuerySearchOptionsForTesting(query: string) {
  return inferQuerySearchOptions(query);
}

export function mergeResultsForTesting(
  localResults: TitleSummary[],
  rawgResults: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
) {
  return mergeResults(localResults, rawgResults, query, intentMode, page, limit);
}

async function getLocalTotalCount(
  client: AdminClient,
  queryVariants: string[],
  page: number,
  limit: number,
  localPageCount: number,
) {
  try {
    return await countLocalResults(client, queryVariants);
  } catch (error) {
    // If counting fails, degrade gracefully using a lower-bound total.
    console.error("Local search count failed; using lower-bound total.", {
      query: queryVariants.join(" | "),
      page,
      limit,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return (page - 1) * limit + localPageCount;
  }
}

function isTruthyFlag(value: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function stripLeadingArticle(value: string) {
  return value.replace(/^(?:the|a|an)\s+/, "");
}

function stripLeadingPossessivePrefix(value: string) {
  return value.replace(/^[a-z0-9]+s?\s+/, "");
}

function getSearchQueryVariants(query: string) {
  return expandNormalizedQueryVariants(query);
}

function getProviderSearchQuery(query: string) {
  return normalizeSearchKey(query);
}

function isSparseBroadFirstPageLocal(
  intentMode: QueryIntentMode,
  page: number,
  visibleLocalPageCount: number,
  localTotalCount: number,
  hasProtectedBroadLocalHead: boolean,
) {
  if (intentMode !== "broad" || page !== 1) {
    return false;
  }

  if (hasProtectedBroadLocalHead) {
    return false;
  }

  const sparseVisiblePage = visibleLocalPageCount <
    MIN_LOCAL_RESULTS_BEFORE_FALLBACK;
  const sparseLocalTotal = localTotalCount < MIN_LOCAL_RESULTS_BEFORE_FALLBACK;

  return sparseVisiblePage || sparseLocalTotal;
}

function getProviderPageBudget(sparseBroadFirstPageLocal: boolean) {
  return sparseBroadFirstPageLocal ? SPARSE_BROAD_PROVIDER_MAX_PAGES : 1;
}

function getProviderDecisionReason(
  forceRefresh: boolean,
  sparseBroadFirstPageLocal: boolean,
): SearchDecisionReason {
  if (forceRefresh) {
    return "forced_refresh";
  }

  if (sparseBroadFirstPageLocal) {
    return "sparse_broad_local";
  }

  return "provider_used";
}

function isBroadSparseFreshLocalSufficient(
  intentMode: QueryIntentMode,
  page: number,
  sparseBroadFirstPageLocal: boolean,
  visibleLocalPageCount: number,
  localStaleRatio: number,
) {
  if (intentMode !== "broad" || page !== 1) {
    return false;
  }

  if (!sparseBroadFirstPageLocal) {
    return false;
  }

  if (visibleLocalPageCount <= 0) {
    return false;
  }

  if (localStaleRatio <= MAX_STALE_RATIO) {
    return true;
  }

  // Tiny sparse pages are unstable under ratio-only freshness checks.
  // Allow one stale item when we have at least 3 visible local results.
  const estimatedStaleCount = Math.round(localStaleRatio * visibleLocalPageCount);
  const sparseStaleBudget = visibleLocalPageCount >= 3 ? 1 : 0;
  return estimatedStaleCount <= sparseStaleBudget;
}

function isSingleTokenFranchiseQuery(
  queryTokens: string[],
  intentMode: QueryIntentMode,
) {
  return intentMode === "broad" && queryTokens.length === 1;
}

function hasMainstreamPlatform(result: TitleSummary) {
  return result.platforms.some((platform) => {
    const name = platform.name.toLowerCase();
    return (
      name.includes("pc") ||
      name.includes("playstation") ||
      name.includes("xbox") ||
      name.includes("nintendo") ||
      name.includes("switch")
    );
  });
}

function computeProviderQualityScore(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
  rankingV2Enabled: boolean,
) {
  if (!rankingV2Enabled) {
    return computeProviderQualityAdjustment(
      result,
      intentMode,
      coverage,
      includesExactQuery,
    );
  }

  return computeProviderQualityAdjustmentV2(
    result,
    intentMode,
    toLexicalConfidence(
      coverage,
      includesExactQuery,
      exactMatch,
      startsWithQuery,
    ),
  );
}

function toLexicalConfidence(
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
): LexicalConfidence {
  if (
    exactMatch ||
    startsWithQuery ||
    (includesExactQuery && coverage >= 0.66)
  ) {
    return "high";
  }

  if (includesExactQuery || coverage >= 0.5) {
    return "medium";
  }

  return "low";
}

function computeBroadLowSignalAdjustment(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  exactMatch: boolean,
  startsWithQuery: boolean,
) {
  if (intentMode !== "broad") {
    return 0;
  }

  const qualityScore = computeProviderQualityComposite(result);
  const isWebOnly =
    result.platforms.length > 0 &&
    result.platforms.every((platform) => {
      const name = platform.name.toLowerCase();
      return name.includes("web") || name.includes("browser");
    });

  if (exactMatch && qualityScore <= 0.18) {
    return isWebOnly ? -720 : -560;
  }

  if (exactMatch && isWebOnly && qualityScore < 0.5) {
    return -620;
  }

  if (startsWithQuery && qualityScore <= 0.12) {
    return isWebOnly ? -320 : -180;
  }

  return 0;
}

function computeBroadRecencyBoost(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
) {
  if (intentMode !== "broad") {
    return 0;
  }

  const hasLexicalAnchor =
    exactMatch ||
    startsWithQuery ||
    (includesExactQuery && coverage >= 0.5) ||
    coverage >= 0.72;
  if (!hasLexicalAnchor) {
    return 0;
  }

  const qualityScore = computeProviderQualityComposite(result);
  const mainstreamPlatform = hasMainstreamPlatform(result);
  if (qualityScore < 0.2 && !mainstreamPlatform) {
    return 0;
  }

  const releaseDate = parseReleaseDate(result.earliestReleaseDate);
  if (!releaseDate) {
    return 0;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysFromNow = Math.round((releaseDate.getTime() - Date.now()) / oneDayMs);
  if (daysFromNow > 0) {
    if (daysFromNow <= 365 * 3) {
      return mainstreamPlatform ? 180 : 90;
    }

    return mainstreamPlatform ? 130 : 65;
  }

  const daysSinceRelease = Math.abs(daysFromNow);
  if (daysSinceRelease <= 365 * 2) {
    return 120;
  }

  if (daysSinceRelease <= 365 * 5) {
    return 70;
  }

  if (daysSinceRelease <= 365 * 10) {
    return 35;
  }

  return 0;
}

function getRelevantLocalStaleRatio(
  localResults: LocalSearchResult[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
) {
  const sample = getRelevantLocalFreshnessWindow(
    localResults,
    query,
    intentMode,
    page,
    limit,
  );
  return getSearchStaleRatio(sample);
}

function getRelevantLocalFreshnessWindow(
  localResults: LocalSearchResult[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
) {
  if (localResults.length <= limit) {
    return localResults;
  }

  const resultById = new Map(
    localResults.map((result) => [result.summary.id, result]),
  );
  const rankedEntries = rankResults(
    localResults.map((result) => result.summary),
    query,
    intentMode,
  );
  const rankedWindow = intentMode === "specific"
    ? applySpecificQueryDenoise(rankedEntries, page, limit).results
    : (isSearchBroadDenoiseEnabled() &&
          isSingleTokenFranchiseQuery(tokenizeSearchKey(query), intentMode)
      ? applyBroadFranchiseDenoise(rankedEntries, limit)
      : rankedEntries);
  const sampleStart = Math.max(0, (page - 1) * limit);
  const sampleEnd = sampleStart + limit;
  const sampledResults = rankedWindow
    .slice(sampleStart, sampleEnd)
    .flatMap((entry) => {
      const localResult = resultById.get(entry.result.id);
      return localResult ? [localResult] : [];
    });

  if (sampledResults.length > 0) {
    return sampledResults;
  }

  return localResults.slice(sampleStart, sampleStart + limit);
}
