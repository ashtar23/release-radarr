import type { TitleSearchResult, TitleSummary } from "@repo/types";

import { env } from "./env";
import { getPostgresPool } from "./postgres";
import { fetchRawgSearchResults } from "./rawg";

type SearchRow = {
  id: string;
  kind: "game";
  source: "rawg";
  external_id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  earliest_release_date: string | Date | null;
  developers: unknown;
  publishers: unknown;
  platforms: unknown;
  rawg_rating: number | null;
  rawg_ratings_count: number | null;
  rawg_metacritic: number | null;
  rawg_added: number | null;
  rawg_reviews_count: number | null;
  rawg_suggestions_count: number | null;
  rawg_rating_top: number | null;
};

type CountRow = {
  total_count: number;
};

interface SearchTitlesParams {
  query: string;
  page: number;
  limit: number;
  forceRefresh: boolean;
}

interface RankedSearchCandidate {
  summary: TitleSummary;
  developers: string[];
  publishers: string[];
}

interface ProviderSearchResult {
  totalCount: number | null;
  results: RankedSearchCandidate[];
}

interface SearchContext {
  normalizedQuery: string;
  queryTokens: string[];
  queryTokenSet: Set<string>;
  intentMode: SearchIntentMode;
  includesEditionTerms: boolean;
}

interface SearchScore {
  total: number;
  qualityScore: number;
}

type SearchIntentMode = "broad" | "specific";

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;
const MAX_LIMIT = 25;
const MIN_QUERY_LENGTH = 2;
const MIN_LOCAL_CANDIDATES = 120;
const MAX_LOCAL_CANDIDATES = 1000;
const MAX_PROVIDER_PAGES = 3;
const BROAD_LOW_QUALITY_THRESHOLD = 0.16;
const STRONG_COVERAGE_THRESHOLD = 0.66;

const TRUSTED_DEVELOPERS = new Set([
  "insomniac games",
  "santa monica studio",
  "naughty dog",
  "fromsoftware",
  "rockstar games",
  "cd projekt red",
  "valve",
  "remedy entertainment",
  "larian studios",
  "kojima productions",
  "capcom",
]);

const TRUSTED_PUBLISHERS = new Set([
  "sony interactive entertainment",
  "playstation publishing llc",
  "xbox game studios",
  "nintendo",
  "bethesda softworks",
  "rockstar games",
  "capcom",
  "square enix",
  "bandai namco entertainment",
  "activision",
  "electronic arts",
  "sega",
]);

const NOISE_KEYWORD_PENALTIES = [
  { keyword: "demo", points: -260 },
  { keyword: "mod", points: -220 },
  { keyword: "fan", points: -180 },
  { keyword: "test", points: -140 },
  { keyword: "prototype", points: -200 },
  { keyword: "simulator", points: -280 },
  { keyword: "demake", points: -260 },
  { keyword: "fangame", points: -240 },
  { keyword: "android", points: -180 },
] as const;

const PARENTHETICAL_NOISE_TOKENS = new Set([
  "arcade",
  "browser",
  "clicker",
  "demo",
  "fan",
  "fangame",
  "mod",
  "prototype",
  "simulator",
  "test",
  "vr",
]);

const EDITION_TERMS = [
  "game of the year",
  "goty",
  "complete edition",
  "definitive edition",
  "ultimate edition",
  "deluxe edition",
  "director cut",
  "directors cut",
  "remastered",
  "remaster",
  "bundle",
  "collection",
  "trilogy",
  "enhanced edition",
] as const;

const SEARCH_PHRASE_ALIASES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bspiderman\b/g, replacement: "spider man" },
  { pattern: /\bgow\b/g, replacement: "god of war" },
];

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

  const searchContext = createSearchContext(normalizedQuery, queryTokens);
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

async function fetchLocalSearchResults(params: {
  queryTokens: string[];
  page: number;
  limit: number;
}) {
  const pool = getPostgresPool();
  const candidateLimit = Math.min(
    Math.max(params.page * params.limit * 5, MIN_LOCAL_CANDIDATES),
    MAX_LOCAL_CANDIDATES,
  );
  const likePatterns = params.queryTokens.map((token) => `%${token}%`);

  const [countResult, rowsResult] = await Promise.all([
    pool.query<CountRow>(
      `
        select count(*)::int as total_count
        from public.titles
        where search_name ilike all($1::text[])
      `,
      [likePatterns],
    ),
    pool.query<SearchRow>(
      `
        select
          id,
          kind,
          source,
          external_id,
          slug,
          name,
          cover_image_url,
          earliest_release_date,
          developers,
          publishers,
          platforms,
          rawg_rating,
          rawg_ratings_count,
          rawg_metacritic,
          rawg_added,
          rawg_reviews_count,
          rawg_suggestions_count,
          rawg_rating_top
        from public.titles
        where search_name ilike all($1::text[])
        order by
          rawg_metacritic desc nulls last,
          rawg_ratings_count desc nulls last,
          rawg_added desc nulls last,
          id asc
        limit $2::int
      `,
      [likePatterns, candidateLimit],
    ),
  ]);

  return {
    totalCount: countResult.rows[0]?.total_count ?? 0,
    results: rowsResult.rows.map(mapSearchRowToCandidate),
  };
}

async function fetchProviderSearchCandidates(params: {
  query: string;
  page: number;
  limit: number;
  rawgApiKey: string;
}): Promise<ProviderSearchResult> {
  const targetCount = params.page * params.limit;
  const results: RankedSearchCandidate[] = [];
  let totalCount: number | null = null;

  for (
    let providerPage = 1;
    providerPage <= Math.min(params.page, MAX_PROVIDER_PAGES);
    providerPage += 1
  ) {
    const providerPageResult = await fetchRawgSearchResults({
      rawgApiKey: params.rawgApiKey,
      query: params.query,
      page: providerPage,
      pageSize: params.limit,
      precise: shouldUsePreciseSearch(params.query),
      exact: false,
    });

    totalCount = providerPageResult.totalCount;
    results.push(
      ...providerPageResult.results.map((result) =>
        createProviderSearchCandidate(result),
      ),
    );

    if (
      results.length >= targetCount ||
      providerPageResult.results.length < params.limit
    ) {
      break;
    }
  }

  return {
    totalCount,
    results,
  };
}

async function upsertProviderSearchResults(results: TitleSummary[]) {
  if (results.length === 0) {
    return;
  }

  const pool = getPostgresPool();
  const now = new Date().toISOString();
  const values: unknown[] = [];
  const rows = results.map((summary, index) => {
    const base = index * 19;
    values.push(
      summary.id,
      summary.kind,
      summary.source,
      summary.externalId,
      summary.slug,
      summary.name,
      normalizeSearchKey(summary.name),
      summary.coverImageUrl,
      summary.earliestReleaseDate,
      JSON.stringify(summary.platforms),
      summary.rawgRating,
      summary.rawgRatingsCount,
      summary.rawgMetacritic,
      summary.rawgAdded,
      summary.rawgReviewsCount,
      summary.rawgSuggestionsCount,
      summary.rawgRatingTop,
      now,
      now,
    );

    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}::jsonb, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16}, $${base + 17}, $${base + 18}::timestamptz, $${base + 19}::timestamptz)`;
  });

  await pool.query(
    `
      insert into public.titles (
        id,
        kind,
        source,
        external_id,
        slug,
        name,
        search_name,
        cover_image_url,
        earliest_release_date,
        platforms,
        rawg_rating,
        rawg_ratings_count,
        rawg_metacritic,
        rawg_added,
        rawg_reviews_count,
        rawg_suggestions_count,
        rawg_rating_top,
        search_updated_at,
        updated_at
      )
      values ${rows.join(", ")}
      on conflict (id) do update
      set
        kind = excluded.kind,
        source = excluded.source,
        external_id = excluded.external_id,
        slug = excluded.slug,
        name = excluded.name,
        search_name = excluded.search_name,
        cover_image_url = excluded.cover_image_url,
        earliest_release_date = excluded.earliest_release_date,
        platforms = excluded.platforms,
        rawg_rating = excluded.rawg_rating,
        rawg_ratings_count = excluded.rawg_ratings_count,
        rawg_metacritic = excluded.rawg_metacritic,
        rawg_added = excluded.rawg_added,
        rawg_reviews_count = excluded.rawg_reviews_count,
        rawg_suggestions_count = excluded.rawg_suggestions_count,
        rawg_rating_top = excluded.rawg_rating_top,
        search_updated_at = excluded.search_updated_at,
        updated_at = excluded.updated_at
    `,
    values,
  );
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

function mapSearchRowToCandidate(row: SearchRow): RankedSearchCandidate {
  return {
    summary: {
      id: row.id,
      kind: row.kind,
      source: row.source,
      externalId: row.external_id,
      slug: row.slug,
      name: row.name,
      coverImageUrl: row.cover_image_url,
      earliestReleaseDate: toIsoDateOrNull(row.earliest_release_date),
      platforms: parsePlatforms(row.platforms),
      rawgRating: row.rawg_rating,
      rawgRatingsCount: row.rawg_ratings_count,
      rawgMetacritic: row.rawg_metacritic,
      rawgAdded: row.rawg_added,
      rawgReviewsCount: row.rawg_reviews_count,
      rawgSuggestionsCount: row.rawg_suggestions_count,
      rawgRatingTop: row.rawg_rating_top,
    },
    developers: parseStringArray(row.developers),
    publishers: parseStringArray(row.publishers),
  };
}

function rankResults(results: RankedSearchCandidate[], context: SearchContext) {
  return [...results].sort((left, right) => {
    const rightScore = calculateSearchScore(right, context);
    const leftScore = calculateSearchScore(left, context);
    const scoreDifference = rightScore.total - leftScore.total;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const qualityDifference = rightScore.qualityScore - leftScore.qualityScore;
    if (qualityDifference !== 0) {
      return qualityDifference;
    }

    const metacriticDifference =
      (right.summary.rawgMetacritic ?? -1) -
      (left.summary.rawgMetacritic ?? -1);
    if (metacriticDifference !== 0) {
      return metacriticDifference;
    }

    const ratingsDifference =
      (right.summary.rawgRatingsCount ?? -1) -
      (left.summary.rawgRatingsCount ?? -1);
    if (ratingsDifference !== 0) {
      return ratingsDifference;
    }

    const addedDifference =
      (right.summary.rawgAdded ?? -1) - (left.summary.rawgAdded ?? -1);
    if (addedDifference !== 0) {
      return addedDifference;
    }

    return left.summary.name.localeCompare(right.summary.name);
  });
}

function calculateSearchScore(
  candidate: RankedSearchCandidate,
  context: SearchContext,
): SearchScore {
  const summary = candidate.summary;
  const normalizedName = normalizeSearchKey(summary.name);
  const nameTokens = normalizedName.split(" ").filter(Boolean);
  const nameTokenSet = new Set(nameTokens);
  const matchedTokenCount = context.queryTokens.filter((token) =>
    nameTokenSet.has(token),
  ).length;
  const coverage =
    context.queryTokens.length === 0
      ? 0
      : matchedTokenCount / context.queryTokens.length;
  const exactMatch = normalizedName === context.normalizedQuery;
  const startsWithQuery = normalizedName.startsWith(context.normalizedQuery);
  const phraseIndex = normalizedName.indexOf(context.normalizedQuery);
  const includesExactQuery = phraseIndex >= 0;
  const extraTokenCount = Math.max(0, nameTokens.length - matchedTokenCount);
  const qualityScore = computeProviderQualityComposite(summary);
  const mainstreamPlatform = hasMainstreamPlatform(summary.platforms);
  const webOnlyPlatform = isWebOnlyPlatform(summary.platforms);

  let total = 0;
  total += computeLexicalScore({
    context,
    coverage,
    exactMatch,
    startsWithQuery,
    includesExactQuery,
    phraseIndex,
    extraTokenCount,
  });
  total += computeMetadataQualityAdjustment(summary, context.intentMode);
  total += computeProviderQualityAdjustment(
    summary,
    context.intentMode,
    coverage,
    includesExactQuery,
  );
  total += computeTrustedMetadataBoost(candidate, coverage, includesExactQuery);
  total += computePlatformAdjustment(
    summary.platforms,
    context,
    mainstreamPlatform,
    webOnlyPlatform,
  );
  total += computeBroadRecencyBoost(
    summary,
    context,
    coverage,
    includesExactQuery,
    exactMatch,
    startsWithQuery,
    qualityScore,
    mainstreamPlatform,
  );
  total += computeBroadLowSignalAdjustment({
    context,
    qualityScore,
    exactMatch,
    startsWithQuery,
    includesExactQuery,
    extraTokenCount,
    mainstreamPlatform,
    webOnlyPlatform,
    summary,
  });
  total += computeNoisePenalty(summary.name, context);
  total += computeEditionPenalty(normalizedName, context);
  total += computeParentheticalNoisePenalty(summary.name, context);

  return {
    total,
    qualityScore,
  };
}

function mergeUniqueResults(
  localResults: RankedSearchCandidate[],
  providerResults: RankedSearchCandidate[],
) {
  const merged = new Map<string, RankedSearchCandidate>();

  for (const result of localResults) {
    merged.set(result.summary.id, result);
  }

  for (const result of providerResults) {
    merged.set(result.summary.id, result);
  }

  return Array.from(merged.values());
}

function slicePage(
  results: RankedSearchCandidate[],
  page: number,
  limit: number,
) {
  const start = (page - 1) * limit;
  return results.slice(start, start + limit);
}

function normalizePage(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_PAGE;
  }

  return Math.floor(value);
}

function normalizeLimit(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(value), MAX_LIMIT);
}

function shouldUsePreciseSearch(query: string) {
  return (
    tokenizeSearchKey(query).length > 1 || normalizeSearchKey(query).length >= 5
  );
}

function createSearchContext(
  normalizedQuery: string,
  queryTokens: string[],
): SearchContext {
  return {
    normalizedQuery,
    queryTokens,
    queryTokenSet: new Set(queryTokens),
    intentMode: queryTokens.length <= 1 ? "broad" : "specific",
    includesEditionTerms: EDITION_TERMS.some((term) =>
      normalizedQuery.includes(term),
    ),
  };
}

function parsePlatforms(value: unknown): TitleSummary["platforms"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }

    return [{ id: record.id, name: record.name }];
  });
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function toIsoDateOrNull(value: string | Date | null) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === "string" ? value : null;
}

function tokenizeSearchKey(value: string) {
  const normalized = normalizeSearchKey(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .map(toCanonicalToken)
    .filter((token) => token.length > 0);
}

function normalizeSearchKey(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/([a-z0-9])['’]s\b/g, "$1s")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return SEARCH_PHRASE_ALIASES.reduce(
    (current, alias) => current.replace(alias.pattern, alias.replacement),
    normalized,
  )
    .replace(/\s+/g, " ")
    .trim();
}

function toCanonicalToken(token: string) {
  if (/^[0-9]+$/.test(token)) {
    return token;
  }

  return ROMAN_NUMERAL_MAP[token] ?? token;
}

const ROMAN_NUMERAL_MAP: Record<string, string> = {
  i: "1",
  ii: "2",
  iii: "3",
  iv: "4",
  v: "5",
  vi: "6",
  vii: "7",
  viii: "8",
  ix: "9",
  x: "10",
  xi: "11",
  xii: "12",
  xiii: "13",
  xiv: "14",
  xv: "15",
  xvi: "16",
  xvii: "17",
  xviii: "18",
  xix: "19",
  xx: "20",
};

function createProviderSearchCandidate(
  summary: TitleSummary,
): RankedSearchCandidate {
  return {
    summary,
    developers: [],
    publishers: [],
  };
}

function computeLexicalScore(params: {
  context: SearchContext;
  coverage: number;
  exactMatch: boolean;
  startsWithQuery: boolean;
  includesExactQuery: boolean;
  phraseIndex: number;
  extraTokenCount: number;
}) {
  let total = 0;

  if (params.exactMatch) {
    total += params.context.intentMode === "specific" ? 1200 : 720;
  } else if (params.startsWithQuery) {
    total += params.context.intentMode === "specific" ? 800 : 540;
  } else if (params.includesExactQuery) {
    total += params.context.intentMode === "specific" ? 350 : 300;
    total -= Math.min(params.phraseIndex, 50) * 2;
  }

  if (params.coverage === 1) {
    total += 320;
  }

  total += Math.round(params.coverage * 220);
  total -=
    Math.min(params.extraTokenCount, 10) *
    (params.context.intentMode === "specific" ? 44 : 16);

  if (params.context.intentMode === "specific" && params.coverage < 0.5) {
    total -= 240;
  }

  return total;
}

function computeMetadataQualityAdjustment(
  summary: TitleSummary,
  intentMode: SearchIntentMode,
) {
  let total = 0;

  total += summary.earliestReleaseDate
    ? intentMode === "specific"
      ? 80
      : 20
    : intentMode === "specific"
      ? -220
      : -50;

  if (summary.platforms.length === 0) {
    total -= intentMode === "specific" ? 140 : 30;
  } else if (summary.platforms.length === 1) {
    total -= intentMode === "specific" ? 60 : 10;
  } else {
    total += Math.min(summary.platforms.length * 28, 112);
  }

  total += summary.coverImageUrl ? 12 : -24;
  return total;
}

function computeProviderQualityAdjustment(
  summary: TitleSummary,
  intentMode: SearchIntentMode,
  coverage: number,
  includesExactQuery: boolean,
) {
  const qualityScore = computeProviderQualityComposite(summary);
  if (qualityScore <= 0) {
    return 0;
  }

  const basePoints = intentMode === "specific" ? 380 : 260;
  const fullPoints = Math.round(basePoints * qualityScore);
  if (includesExactQuery || coverage >= STRONG_COVERAGE_THRESHOLD) {
    return fullPoints;
  }

  if (coverage >= 0.5) {
    return Math.round(fullPoints * 0.5);
  }

  return Math.min(fullPoints, 40);
}

function computeProviderQualityComposite(summary: TitleSummary) {
  const metacriticNorm = normalizeRange(summary.rawgMetacritic, 100);
  const ratingNorm = normalizeRange(summary.rawgRating, 5);
  const ratingsCountNorm = normalizeLogCount(summary.rawgRatingsCount, 6);
  const addedNorm = normalizeLogCount(summary.rawgAdded, 6);
  const reviewsNorm = normalizeLogCount(summary.rawgReviewsCount, 5);
  const suggestionsNorm = normalizeLogCount(summary.rawgSuggestionsCount, 5);
  const ratingTopNorm = normalizeRange(summary.rawgRatingTop, 5);

  return clamp(
    metacriticNorm * 0.34 +
      ratingNorm * 0.26 +
      ratingsCountNorm * 0.2 +
      addedNorm * 0.12 +
      reviewsNorm * 0.05 +
      suggestionsNorm * 0.02 +
      ratingTopNorm * 0.01,
    0,
    1,
  );
}

function computeTrustedMetadataBoost(
  candidate: RankedSearchCandidate,
  coverage: number,
  includesExactQuery: boolean,
) {
  if (!includesExactQuery && coverage < 0.5) {
    return 0;
  }

  let total = 0;
  if (
    candidate.developers
      .map(normalizeSearchKey)
      .some((name) => TRUSTED_DEVELOPERS.has(name))
  ) {
    total += 140;
  }

  if (
    candidate.publishers
      .map(normalizeSearchKey)
      .some((name) => TRUSTED_PUBLISHERS.has(name))
  ) {
    total += 120;
  }

  return Math.min(total, 220);
}

function computePlatformAdjustment(
  platforms: TitleSummary["platforms"],
  context: SearchContext,
  mainstreamPlatform: boolean,
  webOnlyPlatform: boolean,
) {
  let total = 0;

  if (mainstreamPlatform) {
    total += 60;
  }

  if (webOnlyPlatform) {
    total -= context.intentMode === "specific" ? 520 : 220;
  }

  if (
    context.intentMode === "specific" &&
    webOnlyPlatform &&
    !context.queryTokenSet.has("web") &&
    !context.queryTokenSet.has("browser")
  ) {
    total -= 40;
  }

  return total;
}

function computeBroadRecencyBoost(
  summary: TitleSummary,
  context: SearchContext,
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
  qualityScore: number,
  mainstreamPlatform: boolean,
) {
  if (context.intentMode !== "broad") {
    return 0;
  }

  const hasLexicalAnchor =
    exactMatch ||
    startsWithQuery ||
    (includesExactQuery && coverage >= 0.5) ||
    coverage >= STRONG_COVERAGE_THRESHOLD;
  if (!hasLexicalAnchor) {
    return 0;
  }

  if (qualityScore < 0.2 && !mainstreamPlatform) {
    return 0;
  }

  const releaseDate = parseReleaseDate(summary.earliestReleaseDate);
  if (!releaseDate) {
    return 0;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysFromNow = Math.round(
    (releaseDate.getTime() - Date.now()) / oneDayMs,
  );
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

function computeBroadLowSignalAdjustment(params: {
  context: SearchContext;
  qualityScore: number;
  exactMatch: boolean;
  startsWithQuery: boolean;
  includesExactQuery: boolean;
  extraTokenCount: number;
  mainstreamPlatform: boolean;
  webOnlyPlatform: boolean;
  summary: TitleSummary;
}) {
  if (params.context.intentMode !== "broad") {
    return 0;
  }

  if (params.includesExactQuery && params.extraTokenCount === 0) {
    return 0;
  }

  if (isAnticipationProtected(params.summary, params.mainstreamPlatform)) {
    return 0;
  }

  let total = 0;
  if (params.exactMatch && params.qualityScore <= 0.18) {
    total -= params.webOnlyPlatform ? 720 : 560;
  }

  if (params.startsWithQuery && params.qualityScore <= 0.12) {
    total -= params.webOnlyPlatform ? 320 : 180;
  }

  if (
    params.extraTokenCount > 0 &&
    (params.qualityScore < BROAD_LOW_QUALITY_THRESHOLD ||
      hasVeryLowEngagement(params.summary))
  ) {
    total -= 260;
  }

  return total;
}

function computeNoisePenalty(name: string, context: SearchContext) {
  const normalizedNameTokens = new Set(tokenizeSearchKey(name));
  let total = 0;

  for (const penalty of NOISE_KEYWORD_PENALTIES) {
    if (
      normalizedNameTokens.has(penalty.keyword) &&
      !context.queryTokenSet.has(penalty.keyword)
    ) {
      total += penalty.points;
    }
  }

  return total;
}

function computeEditionPenalty(normalizedName: string, context: SearchContext) {
  const hasEditionTerm = EDITION_TERMS.some((term) =>
    normalizedName.includes(term),
  );
  if (!hasEditionTerm) {
    return 40;
  }

  return context.includesEditionTerms ? 0 : -90;
}

function computeParentheticalNoisePenalty(
  name: string,
  context: SearchContext,
) {
  const matches = [...name.matchAll(/\(([^)]+)\)/g)];
  if (matches.length === 0) {
    return 0;
  }

  let total = 0;
  for (const match of matches) {
    const group = match[1];
    if (!group) {
      continue;
    }

    const groupTokens = normalizeSearchKey(group).split(" ").filter(Boolean);
    const isNoiseGroup = groupTokens.some((token) =>
      PARENTHETICAL_NOISE_TOKENS.has(token),
    );

    if (
      isNoiseGroup &&
      !groupTokens.some((token) => context.queryTokenSet.has(token))
    ) {
      total -= 120;
    }
  }

  return total;
}

function hasMainstreamPlatform(platforms: TitleSummary["platforms"]) {
  return platforms.some((platform) => {
    const name = normalizeSearchKey(platform.name);
    return (
      name.includes("pc") ||
      name.includes("playstation") ||
      name.includes("xbox") ||
      name.includes("nintendo") ||
      name.includes("switch")
    );
  });
}

function isWebOnlyPlatform(platforms: TitleSummary["platforms"]) {
  if (platforms.length === 0) {
    return false;
  }

  return platforms.every((platform) => {
    const name = normalizeSearchKey(platform.name);
    return (
      name.includes("web") ||
      name.includes("browser") ||
      name.includes("html5") ||
      name === "io"
    );
  });
}

function hasVeryLowEngagement(summary: TitleSummary) {
  return (
    (summary.rawgRatingsCount ?? 0) < 50 &&
    (summary.rawgAdded ?? 0) < 250 &&
    (summary.rawgReviewsCount ?? 0) < 25
  );
}

function isAnticipationProtected(
  summary: TitleSummary,
  mainstreamPlatform: boolean,
) {
  if (!mainstreamPlatform) {
    return false;
  }

  const hasStrongPopularitySignal =
    (summary.rawgAdded ?? 0) >= 8000 || (summary.rawgRatingsCount ?? 0) >= 1500;
  const hasMajorQualitySignals =
    (summary.rawgMetacritic ?? 0) >= 80 || (summary.rawgRating ?? 0) >= 4.2;
  const hasMajorEngagementSignals =
    (summary.rawgRatingsCount ?? 0) >= 1200 || (summary.rawgAdded ?? 0) >= 7000;

  if (isFutureReleaseDate(summary.earliestReleaseDate)) {
    return (
      hasMajorQualitySignals ||
      hasMajorEngagementSignals ||
      (summary.rawgAdded ?? 0) >= 2000 ||
      (summary.rawgRatingsCount ?? 0) >= 250
    );
  }

  if (!hasStrongPopularitySignal) {
    return false;
  }

  return hasMajorQualitySignals && hasMajorEngagementSignals;
}

function isFutureReleaseDate(value: string | null) {
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) {
    return false;
  }

  return releaseDate.getTime() > Date.now();
}

function parseReleaseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function normalizeRange(value: number | null, max: number) {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  return clamp(value / max, 0, 1);
}

function normalizeLogCount(value: number | null, logMax: number) {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return clamp(Math.log10(1 + value) / logMax, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
