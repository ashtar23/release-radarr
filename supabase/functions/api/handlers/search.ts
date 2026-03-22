import {
  MIN_QUERY_LENGTH,
} from "../config.ts";
import {
  countLocalResults,
  findLocalResultsPage,
  upsertSearchResults,
} from "../data/titles-repository.ts";
import { fetchRawgSearchResults } from "../providers/rawg.ts";
import type { AdminClient, RawgSearchPage, TitleSummary } from "../types.ts";
import { jsonResponse } from "../utils/http.ts";
import { clampLimit, clampPage } from "../utils/values.ts";

type QueryIntentMode = "broad" | "specific";
interface QuerySearchOptions {
  intentMode: QueryIntentMode;
  precise: boolean;
  exact: boolean;
}

export async function handleSearchRequest(client: AdminClient, url: URL) {
  const query = url.searchParams.get("query")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return jsonResponse(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
      400,
    );
  }

  const searchOptions = inferQuerySearchOptions(query);
  const limit = clampLimit(url.searchParams.get("limit"));
  const page = clampPage(url.searchParams.get("page"));
  const localPage = await findLocalResultsPage(client, query, page, limit);
  const localResults = localPage.results;
  const localSummaries = localResults.map((result) => result.summary);
  const returnResults = (
    results: TitleSummary[],
    totalCount: number,
    hasMoreOverride?: boolean,
  ) =>
    jsonResponse({
      query,
      results,
      totalCount,
      page,
      limit,
      hasMore: hasMoreOverride ?? page * limit < totalCount,
    });
  const returnLocalResults = async () => {
    const localTotalCount = await getLocalTotalCount(
      client,
      query,
      page,
      limit,
      localSummaries.length,
    );
    return returnResults(localSummaries, localTotalCount);
  };

  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    return returnLocalResults();
  }

  const rawgPage = await tryFetchRawgSearchResults(
    query,
    page,
    limit,
    searchOptions.precise,
    searchOptions.exact,
    rawgApiKey,
  );
  if (!rawgPage) {
    return returnLocalResults();
  }

  const dedupedRawgResults = dedupeById(rawgPage.results);
  const now = new Date().toISOString();
  if (dedupedRawgResults.length > 0) {
    const errorMessage = await upsertSearchResults(client, dedupedRawgResults, now);

    if (errorMessage) {
      console.error("Search cache upsert failed; serving RAWG page without cache write.", {
        query,
        page,
        limit,
        errorMessage,
      });
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
    return returnResults(mergedResults.results, totalCount, false);
  }

  const totalCount = Math.max(
    rawgPage.totalCount ??
      await getLocalTotalCount(client, query, page, limit, localSummaries.length),
    mergedResults.results.length,
  );
  return returnResults(mergedResults.results, totalCount);
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

  if (intentMode !== "specific") {
    return {
      results: rankedResults.slice(0, limit).map((entry) => entry.result),
      relevanceExhausted: false,
    };
  }

  const denoised = applySpecificQueryDenoise(rankedResults, page, limit);
  return {
    results: denoised.results.slice(0, limit).map((entry) => entry.result),
    relevanceExhausted: denoised.relevanceExhausted,
  };
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
  includesExactQuery: boolean;
}

function rankResults(
  results: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
) {
  const normalizedQuery = toCanonicalSearchString(query);
  const queryTokens = tokenizeSearchText(query);
  const queryTokenSet = new Set(queryTokens);
  const ranked = results.map((result) =>
    scoreResult(result, normalizedQuery, queryTokens, queryTokenSet, intentMode)
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

  return sorted;
}

function scoreResult(
  result: TitleSummary,
  normalizedQuery: string,
  queryTokens: string[],
  queryTokenSet: Set<string>,
  intentMode: QueryIntentMode,
): RankedSearchResult {
  const normalizedName = toCanonicalSearchString(result.name);
  const nameTokens = tokenizeSearchText(result.name);
  const nameTokenSet = new Set(nameTokens);
  const queryNumericTokens = extractNumericTokens(queryTokens);
  const matchedTokens = queryTokens.filter((token) => nameTokenSet.has(token)).length;
  const coverage = queryTokens.length > 0 ? matchedTokens / queryTokens.length : 0;
  const includesExactQuery = normalizedName.includes(normalizedQuery);
  const startsWithQuery = normalizedName.startsWith(normalizedQuery);
  const exactMatch = normalizedName === normalizedQuery;

  let score = 0;

  if (exactMatch) score += 1200;
  else if (startsWithQuery) score += 800;
  else if (includesExactQuery) score += 350;

  if (matchedTokens === queryTokens.length && queryTokens.length > 0) {
    score += 320;
  }
  score += Math.round(coverage * 220);

  const extraTokenCount = nameTokens.filter((token) => !queryTokenSet.has(token)).length;
  if (extraTokenCount > 0) {
    score -= Math.min(extraTokenCount, 10) * (intentMode === "specific" ? 44 : 16);
  }

  const hasEditionSuffix = /(?:complete|edition|enhanced|game of the year|goty|remaster|definitive|director'?s cut|ultimate|bundle)\b/.test(
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
  score += computePlatformRelevanceAdjustment(result, queryTokenSet, intentMode);
  score += computeNoisePenalty(result, queryTokenSet, intentMode);
  score += computeMetadataQualityAdjustment(result, intentMode);
  score += computeNumericIntentAdjustment(
    nameTokenSet,
    queryNumericTokens,
    intentMode,
  );

  return { result, score, coverage, includesExactQuery };
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

function isStrongSpecificMatch(result: RankedSearchResult) {
  return result.includesExactQuery || result.coverage >= 0.66 || result.score >= 720;
}

function inferQuerySearchOptions(query: string): QuerySearchOptions {
  const normalizedQuery = toCanonicalSearchString(query);
  const tokens = tokenizeSearchText(query);
  const hasNumericToken = tokens.some((token) => /^[0-9]+$/.test(token));
  const hasMultipleTokens = tokens.length >= 2;
  const looksSpecific = normalizedQuery.length >= 10;

  const intentMode: QueryIntentMode =
    hasNumericToken || hasMultipleTokens || looksSpecific ? "specific" : "broad";

  return {
    intentMode,
    precise: intentMode === "specific",
    // RAWG exact matching is brittle for real-world title input
    // (diacritics, punctuation, alt naming). Favor recall + our ranking.
    exact: false,
  };
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(value: string) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .map(toCanonicalToken)
    .filter((token) => token.length > 0);
}

function toCanonicalSearchString(value: string) {
  return tokenizeSearchText(value).join(" ");
}

function toCanonicalToken(token: string) {
  if (/^[0-9]+$/.test(token)) {
    return token;
  }

  const romanAsNumber = romanNumeralToNumber(token);
  if (romanAsNumber !== null) {
    return String(romanAsNumber);
  }

  return token;
}

function extractNumericTokens(tokens: string[]) {
  return tokens.filter((token) => /^[0-9]+$/.test(token));
}

function romanNumeralToNumber(value: string) {
  const romanMap: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
    xiii: 13,
    xiv: 14,
    xv: 15,
    xvi: 16,
    xvii: 17,
    xviii: 18,
    xix: 19,
    xx: 20,
  };

  return romanMap[value] ?? null;
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

  const isWebOnly = platformNames.every((name) =>
    name.includes("web") || name.includes("browser")
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

  const hasMainstreamPlatform = platformNames.some((name) =>
    name.includes("pc") ||
    name.includes("playstation") ||
    name.includes("xbox") ||
    name.includes("nintendo") ||
    name.includes("switch")
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
    nameTokenSet.has(token)
  );
  if (!hasEveryRequestedNumber) {
    return -460;
  }

  const hasOtherNumbers = [...nameTokenSet].some((token) =>
    /^[0-9]+$/.test(token) && !queryNumericTokens.includes(token)
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
  intentMode: QueryIntentMode,
) {
  if (intentMode !== "specific") {
    return 0;
  }

  const normalizedName = normalizeSearchText(result.name);
  const penalties: Array<{ keyword: string; points: number }> = [
    { keyword: "demo", points: -260 },
    { keyword: "mod", points: -220 },
    { keyword: "fan", points: -180 },
    { keyword: "test", points: -140 },
    { keyword: "prototype", points: -200 },
  ];

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

async function getLocalTotalCount(
  client: AdminClient,
  query: string,
  page: number,
  limit: number,
  localPageCount: number,
) {
  try {
    return await countLocalResults(client, query);
  } catch (error) {
    // If counting fails, degrade gracefully using a lower-bound total.
    console.error("Local search count failed; using lower-bound total.", {
      query,
      page,
      limit,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return (page - 1) * limit + localPageCount;
  }
}
