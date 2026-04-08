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
  normalizeSearchKey,
  parsePlatforms,
  parseStringArray,
  shouldUsePreciseSearch,
  toIsoDateOrNull,
} from "./normalize";
import type {
  CountRow,
  ProviderSearchResult,
  RankedSearchCandidate,
  SearchRow,
} from "./types";

export async function fetchLocalSearchResults(params: {
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

export async function fetchProviderSearchCandidates(params: {
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

export async function upsertProviderSearchResults(results: TitleSummary[]) {
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

export async function enrichProviderSearchResults(params: {
  results: RankedSearchCandidate[];
  rawgApiKey: string;
}) {
  const topProviderResults = params.results.slice(
    0,
    PROVIDER_DETAIL_ENRICHMENT_LIMIT,
  );
  if (topProviderResults.length === 0) {
    return;
  }

  const idsMissingDetails = await selectIdsMissingDetails(
    topProviderResults.map((result) => result.summary.id),
  );

  if (idsMissingDetails.size === 0) {
    return;
  }

  const detailFetchResults = await Promise.allSettled(
    topProviderResults
      .filter((result) => idsMissingDetails.has(result.summary.id))
      .map((result) =>
        fetchRawgDetail({
          rawgApiKey: params.rawgApiKey,
          externalId: result.summary.externalId,
        }),
      ),
  );

  const detailsToUpsert = detailFetchResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (detailsToUpsert.length === 0) {
    return;
  }

  await upsertProviderDetailResults(detailsToUpsert);
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
