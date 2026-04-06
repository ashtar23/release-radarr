import type { TitleSummary } from "@repo/types";

import { getPostgresPool } from "../postgres";
import { fetchRawgSearchResults } from "../rawg";
import {
  MAX_LOCAL_CANDIDATES,
  MAX_PROVIDER_PAGES,
  MIN_LOCAL_CANDIDATES,
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
