import type { TitleDetails, TitleSummary } from "@repo/types";

import { getPostgresPool } from "../postgres";
import { fetchRawgDetail, fetchRawgSearchResults } from "../rawg";
import {
  MAX_LOCAL_CANDIDATES,
  MAX_PROVIDER_PAGES,
  MIN_LOCAL_CANDIDATES,
  PROVIDER_DETAIL_ENRICHMENT_LIMIT,
} from "./constants";
import {
  getMeaningfulSearchTokens,
  normalizeSearchKey,
  parsePlatforms,
  parseStringArray,
  shouldUsePreciseSearch,
  tokenizeSearchKey,
  toIsoDateOrNull,
} from "./normalize";
import { getLocalSearchPolicy } from "./local-search-policy";
import type {
  CountRow,
  ProviderSearchResult,
  RankedSearchCandidate,
  SearchRow,
} from "./types";

export async function fetchLocalSearchResults(params: {
  normalizedQuery: string;
  queryTokens: string[];
  intentMode: "broad" | "specific";
  page: number;
  limit: number;
}) {
  const pool = getPostgresPool();
  const candidateLimit = Math.min(
    Math.max(params.page * params.limit * 5, MIN_LOCAL_CANDIDATES),
    MAX_LOCAL_CANDIDATES,
  );
  const startsWithPattern = `${params.normalizedQuery}%`;
  const searchPolicy = getLocalSearchPolicy({
    normalizedQuery: params.normalizedQuery,
    queryTokens: params.queryTokens,
    intentMode: params.intentMode,
  });
  const matchTokenPatterns = searchPolicy.matchTokens.map(
    (token) => `%${token}%`,
  );

  const [countResult, rowsResult] = await Promise.all([
    pool.query<CountRow>(
      `
        with local_candidates as (
          select
            t.id,
            case when t.search_name = $1 then 1 else 0 end as exact_match,
            case when t.search_name like $2 then 1 else 0 end as starts_with_query,
            case when position($1 in t.search_name) > 0 then 1 else 0 end as contains_query,
            case
              when to_tsvector('simple', t.search_name) @@ phraseto_tsquery('simple', $5)
              then 1
              else 0
            end as phrase_match,
            (
              select count(*)::int
              from unnest($3::text[]) as token
              where position(token in t.search_name) > 0
            ) as token_match_count,
            similarity(t.search_name, $1) as name_similarity
          from public.titles t
          where
            t.search_name = $1
            or t.search_name like $2
            or position($1 in t.search_name) > 0
            or to_tsvector('simple', t.search_name) @@ phraseto_tsquery('simple', $5)
            or t.search_name % $1
            or t.search_name ilike any($4::text[])
        )
        select count(*)::int as total_count
        from local_candidates
        where
          exact_match = 1
          or starts_with_query = 1
          or contains_query = 1
          or phrase_match = 1
          or (
            $9::boolean = false
            and token_match_count >= $6
          )
          or (
            $10::boolean = true
            and name_similarity >= $8
          )
          or (
            $9::boolean = false
            and token_match_count >= greatest($6 - 1, 1)
            and name_similarity >= $7
          )
      `,
      [
        params.normalizedQuery,
        startsWithPattern,
        searchPolicy.matchTokens,
        matchTokenPatterns,
        params.normalizedQuery,
        searchPolicy.minimumTokenMatches,
        searchPolicy.minimumPartialSimilarity,
        searchPolicy.minimumSimilarity,
        searchPolicy.requirePhraseAnchor,
        searchPolicy.allowSimilarityFallback,
      ],
    ),
    pool.query<SearchRow>(
      `
        with local_candidates as (
          select
            t.id,
            t.kind,
            t.source,
            t.external_id,
            t.slug,
            t.name,
            t.cover_image_url,
            t.earliest_release_date,
            t.developers,
            t.publishers,
            t.platforms,
            t.rawg_rating,
            t.rawg_ratings_count,
            t.rawg_metacritic,
            t.rawg_added,
            t.rawg_reviews_count,
            t.rawg_suggestions_count,
            t.rawg_rating_top,
            case when t.search_name = $1 then 1 else 0 end as exact_match,
            case when t.search_name like $2 then 1 else 0 end as starts_with_query,
            case when position($1 in t.search_name) > 0 then 1 else 0 end as contains_query,
            case
              when to_tsvector('simple', t.search_name) @@ phraseto_tsquery('simple', $5)
              then 1
              else 0
            end as phrase_match,
            (
              select count(*)::int
              from unnest($3::text[]) as token
              where position(token in t.search_name) > 0
            ) as token_match_count,
            similarity(t.search_name, $1) as name_similarity
          from public.titles t
          where
            t.search_name = $1
            or t.search_name like $2
            or position($1 in t.search_name) > 0
            or to_tsvector('simple', t.search_name) @@ phraseto_tsquery('simple', $5)
            or t.search_name % $1
            or t.search_name ilike any($4::text[])
        )
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
        from local_candidates
        where
          exact_match = 1
          or starts_with_query = 1
          or contains_query = 1
          or phrase_match = 1
          or (
            $9::boolean = false
            and token_match_count >= $6
          )
          or (
            $10::boolean = true
            and name_similarity >= $8
          )
          or (
            $9::boolean = false
            and token_match_count >= greatest($6 - 1, 1)
            and name_similarity >= $7
          )
        order by
          exact_match desc,
          starts_with_query desc,
          contains_query desc,
          phrase_match desc,
          token_match_count desc,
          name_similarity desc,
          rawg_metacritic desc nulls last,
          rawg_ratings_count desc nulls last,
          rawg_added desc nulls last,
          id asc
        limit $11::int
      `,
      [
        params.normalizedQuery,
        startsWithPattern,
        searchPolicy.matchTokens,
        matchTokenPatterns,
        params.normalizedQuery,
        searchPolicy.minimumTokenMatches,
        searchPolicy.minimumPartialSimilarity,
        searchPolicy.minimumSimilarity,
        searchPolicy.requirePhraseAnchor,
        searchPolicy.allowSimilarityFallback,
        candidateLimit,
      ],
    ),
  ]);

  return {
    totalCount: countResult.rows[0]?.total_count ?? 0,
    results: rowsResult.rows.map(mapSearchRowToCandidate),
  };
}

export async function fetchProviderSearchCandidates(
  params: {
    query: string;
    page: number;
    limit: number;
    rawgApiKey: string;
  },
  deps?: {
    fetchRawgSearchResults: typeof fetchRawgSearchResults;
    logProviderFetchFailure: typeof logProviderFetchFailure;
  },
): Promise<ProviderSearchResult> {
  const fetchSearchResults =
    deps?.fetchRawgSearchResults ?? fetchRawgSearchResults;
  const logFailure = deps?.logProviderFetchFailure ?? logProviderFetchFailure;
  const targetCount = params.page * params.limit;
  const results: RankedSearchCandidate[] = [];
  const normalizedQuery = normalizeSearchKey(params.query);
  const queryTokens = tokenizeSearchKey(params.query);
  const meaningfulQueryTokens = getMeaningfulSearchTokens(queryTokens);
  const applySpecificNumericFilter = shouldApplySpecificNumericProviderFilter({
    queryTokens,
    meaningfulQueryTokens,
  });
  let totalCount: number | null = null;
  const precise = shouldUsePreciseSearch(params.query);

  for (
    let providerPage = 1;
    providerPage <= Math.min(params.page, MAX_PROVIDER_PAGES);
    providerPage += 1
  ) {
    const providerPageResult = await fetchProviderPageWithFallback(
      {
        rawgApiKey: params.rawgApiKey,
        query: params.query,
        page: providerPage,
        pageSize: params.limit,
        precise,
      },
      {
        fetchRawgSearchResults: fetchSearchResults,
        logProviderFetchFailure: logFailure,
      },
    );

    totalCount = providerPageResult.totalCount;
    const filteredResults = filterProviderSearchResults(
      providerPageResult.results,
      {
        normalizedQuery,
        meaningfulQueryTokens,
        applySpecificNumericFilter,
      },
    );
    results.push(
      ...filteredResults.map((result) => createProviderSearchCandidate(result)),
    );

    if (
      results.length >= targetCount ||
      providerPageResult.results.length < params.limit
    ) {
      break;
    }
  }

  return {
    totalCount: applySpecificNumericFilter ? results.length : totalCount,
    results,
  };
}

function shouldApplySpecificNumericProviderFilter(params: {
  queryTokens: string[];
  meaningfulQueryTokens: string[];
}) {
  const hasNumericToken = params.queryTokens.some((token) => /\d/.test(token));
  if (!hasNumericToken) {
    return false;
  }

  if (params.meaningfulQueryTokens.length >= 2) {
    return true;
  }

  return (params.meaningfulQueryTokens[0]?.length ?? 0) >= 5;
}

function filterProviderSearchResults(
  results: TitleSummary[],
  params: {
    normalizedQuery: string;
    meaningfulQueryTokens: string[];
    applySpecificNumericFilter: boolean;
  },
) {
  if (!params.applySpecificNumericFilter) {
    return results;
  }

  const requiredMeaningfulMatches = Math.max(
    1,
    params.meaningfulQueryTokens.length,
  );

  return results.filter((result) => {
    const normalizedName = normalizeSearchKey(result.name);
    if (
      normalizedName === params.normalizedQuery ||
      normalizedName.includes(params.normalizedQuery)
    ) {
      return true;
    }

    const nameTokens = tokenizeSearchKey(result.name);
    const meaningfulMatches = params.meaningfulQueryTokens.filter(
      (queryToken) => hasApproximateTokenMatch(queryToken, nameTokens),
    ).length;

    return meaningfulMatches >= requiredMeaningfulMatches;
  });
}

function hasApproximateTokenMatch(queryToken: string, nameTokens: string[]) {
  return nameTokens.some((nameToken) => {
    if (nameToken === queryToken) {
      return true;
    }

    if (
      queryToken.length >= 5 &&
      nameToken.length >= 5 &&
      sharedPrefixLength(queryToken, nameToken) >= 4
    ) {
      return true;
    }

    const distance = getEditDistance(queryToken, nameToken);
    if (queryToken.length >= 7 || nameToken.length >= 7) {
      return distance <= 2;
    }

    return distance <= 1;
  });
}

function sharedPrefixLength(left: string, right: string) {
  const max = Math.min(left.length, right.length);
  let index = 0;

  while (index < max && left[index] === right[index]) {
    index += 1;
  }

  return index;
}

function getEditDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      current[rightIndex] = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + substitutionCost,
      );
    }

    for (let index = 0; index < current.length; index += 1) {
      previous[index] = current[index]!;
    }
  }

  return previous[right.length]!;
}

async function fetchProviderPageWithFallback(
  params: {
    rawgApiKey: string;
    query: string;
    page: number;
    pageSize: number;
    precise: boolean;
  },
  deps: {
    fetchRawgSearchResults: typeof fetchRawgSearchResults;
    logProviderFetchFailure: typeof logProviderFetchFailure;
  },
) {
  try {
    return await deps.fetchRawgSearchResults({
      rawgApiKey: params.rawgApiKey,
      query: params.query,
      page: params.page,
      pageSize: params.pageSize,
      precise: params.precise,
      exact: false,
    });
  } catch (error) {
    if (!params.precise) {
      throw error;
    }

    deps.logProviderFetchFailure("precise", params.query, error);

    return deps.fetchRawgSearchResults({
      rawgApiKey: params.rawgApiKey,
      query: params.query,
      page: params.page,
      pageSize: params.pageSize,
      precise: false,
      exact: false,
    });
  }
}

function logProviderFetchFailure(
  mode: "precise" | "fallback",
  query: string,
  error: unknown,
) {
  console.error("Search provider fetch failed.", {
    mode,
    query,
    error,
  });
}

export async function upsertTitleSummaries(results: TitleSummary[]) {
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

export async function upsertProviderSearchResults(results: TitleSummary[]) {
  await upsertTitleSummaries(results);
}

export async function enrichProviderSearchResults(params: {
  results: RankedSearchCandidate[];
  rawgApiKey: string;
}) {
  await enrichTitleSummaries({
    summaries: params.results.map((result) => result.summary),
    rawgApiKey: params.rawgApiKey,
    limit: PROVIDER_DETAIL_ENRICHMENT_LIMIT,
  });
}

export async function enrichTitleSummaries(params: {
  summaries: TitleSummary[];
  rawgApiKey: string;
  limit?: number;
}) {
  const topSummaries = params.summaries.slice(
    0,
    params.limit ?? PROVIDER_DETAIL_ENRICHMENT_LIMIT,
  );
  if (topSummaries.length === 0) {
    return 0;
  }

  const idsMissingDetails = await selectIdsMissingDetails(
    topSummaries.map((summary) => summary.id),
  );

  if (idsMissingDetails.size === 0) {
    return 0;
  }

  const detailFetchResults = await Promise.allSettled(
    topSummaries
      .filter((summary) => idsMissingDetails.has(summary.id))
      .map((summary) =>
        fetchRawgDetail({
          rawgApiKey: params.rawgApiKey,
          externalId: summary.externalId,
        }),
      ),
  );

  const detailsToUpsert = detailFetchResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (detailsToUpsert.length === 0) {
    return 0;
  }

  await upsertProviderDetailResults(detailsToUpsert);
  return detailsToUpsert.length;
}

export function mergeUniqueResults(
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

function createProviderSearchCandidate(
  summary: TitleSummary,
): RankedSearchCandidate {
  return {
    summary,
    developers: [],
    publishers: [],
  };
}

type DetailStateRow = {
  id: string;
  description: string | null;
  genres: unknown;
  developers: unknown;
  publishers: unknown;
  website_url: string | null;
  releases: unknown;
  detail_updated_at: string | Date | null;
};

async function selectIdsMissingDetails(ids: string[]) {
  if (ids.length === 0) {
    return new Set<string>();
  }

  const pool = getPostgresPool();
  const result = await pool.query<DetailStateRow>(
    `
      select
        id,
        description,
        genres,
        developers,
        publishers,
        website_url,
        releases,
        detail_updated_at
      from public.titles
      where id = any($1::text[])
    `,
    [ids],
  );

  const detailStateById = new Map(result.rows.map((row) => [row.id, row]));

  return new Set(
    ids.filter((id) => {
      const row = detailStateById.get(id);
      return !row || isMissingMeaningfulDetails(row);
    }),
  );
}

function isMissingMeaningfulDetails(row: DetailStateRow) {
  if (!row.detail_updated_at) {
    return true;
  }

  return !(
    hasNonEmptyString(row.description) ||
    hasStringValues(row.genres) ||
    hasStringValues(row.developers) ||
    hasStringValues(row.publishers) ||
    hasNonEmptyString(row.website_url) ||
    hasObjectValues(row.releases)
  );
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasStringValues(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && item.length > 0)
  );
}

function hasObjectValues(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some((item) => item && typeof item === "object")
  );
}

async function upsertProviderDetailResults(results: TitleDetails[]) {
  if (results.length === 0) {
    return;
  }

  const pool = getPostgresPool();
  const now = new Date().toISOString();
  const values: unknown[] = [];
  const rows = results.map((detail, index) => {
    const base = index * 26;
    values.push(
      detail.id,
      detail.kind,
      detail.source,
      detail.externalId,
      detail.slug,
      detail.name,
      normalizeSearchKey(detail.name),
      detail.coverImageUrl,
      detail.earliestReleaseDate,
      JSON.stringify(detail.platforms),
      detail.description,
      detail.genres,
      detail.developers,
      detail.publishers,
      detail.websiteUrl,
      JSON.stringify(detail.releases),
      detail.rawgRating,
      detail.rawgRatingsCount,
      detail.rawgMetacritic,
      detail.rawgAdded,
      detail.rawgReviewsCount,
      detail.rawgSuggestionsCount,
      detail.rawgRatingTop,
      now,
      now,
      now,
    );

    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}::jsonb, $${base + 11}, $${base + 12}::text[], $${base + 13}::text[], $${base + 14}::text[], $${base + 15}, $${base + 16}::jsonb, $${base + 17}, $${base + 18}, $${base + 19}, $${base + 20}, $${base + 21}, $${base + 22}, $${base + 23}, $${base + 24}::timestamptz, $${base + 25}::timestamptz, $${base + 26}::timestamptz)`;
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
        description,
        genres,
        developers,
        publishers,
        website_url,
        releases,
        rawg_rating,
        rawg_ratings_count,
        rawg_metacritic,
        rawg_added,
        rawg_reviews_count,
        rawg_suggestions_count,
        rawg_rating_top,
        search_updated_at,
        detail_updated_at,
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
        description = excluded.description,
        genres = excluded.genres,
        developers = excluded.developers,
        publishers = excluded.publishers,
        website_url = excluded.website_url,
        releases = excluded.releases,
        rawg_rating = excluded.rawg_rating,
        rawg_ratings_count = excluded.rawg_ratings_count,
        rawg_metacritic = excluded.rawg_metacritic,
        rawg_added = excluded.rawg_added,
        rawg_reviews_count = excluded.rawg_reviews_count,
        rawg_suggestions_count = excluded.rawg_suggestions_count,
        rawg_rating_top = excluded.rawg_rating_top,
        search_updated_at = excluded.search_updated_at,
        detail_updated_at = excluded.detail_updated_at,
        updated_at = excluded.updated_at
    `,
    values,
  );
}
