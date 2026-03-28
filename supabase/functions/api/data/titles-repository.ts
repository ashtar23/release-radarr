import type {
  AdminClient,
  CachedTitleRow,
  LocalSearchResult,
  TitleDetails,
  TitleSummary,
} from "../types.ts";
import type { SearchLocalCountMode } from "../config.ts";
import {
  mapCachedRowToTitleSummary,
  mapDetailToUpsertRow,
  mapSummaryToSearchUpsertRow,
} from "../mapping/titles.ts";

export interface LocalResultsPage {
  results: LocalSearchResult[];
  candidateSize: number;
}

export async function findLocalResultsPage(
  client: AdminClient,
  queries: string[],
  page: number,
  limit: number,
): Promise<LocalResultsPage> {
  const candidateSize = Math.min(Math.max(page * limit * 5, 120), 1000);
  const from = 0;
  const to = candidateSize - 1;
  const searchQuery = buildNameSearchQuery(
    client
      .from("titles")
      .select(
        "id, kind, source, external_id, slug, name, search_name, cover_image_url, earliest_release_date, platforms, search_updated_at, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top",
      )
      .order("rawg_metacritic", { ascending: false, nullsFirst: false })
      .order("rawg_ratings_count", { ascending: false, nullsFirst: false })
      .order("rawg_added", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, to),
    queries,
  );
  const { data, error } = await searchQuery;

  if (error) {
    throw new Error(error.message);
  }

  return {
    results: ((data ?? []) as CachedTitleRow[]).map((row) => ({
      summary: mapCachedRowToTitleSummary(row),
      searchUpdatedAt: row.search_updated_at,
    })),
    candidateSize,
  };
}

export async function countLocalResults(
  client: AdminClient,
  queries: string[],
  countMode: SearchLocalCountMode = "exact",
): Promise<number> {
  const searchQuery = buildNameSearchQuery(
    client.from("titles").select("id", { count: countMode, head: true }),
    queries,
  );
  const { error, count } = await searchQuery;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function buildNameSearchQuery<TQuery>(queryBuilder: TQuery, queries: string[]) {
  const normalizedQueries = queries
    .map((query) => query.trim())
    .filter((query, index, allQueries) => {
      if (query.length === 0) {
        return false;
      }

      return allQueries.findIndex((candidate) =>
        candidate.toLowerCase() === query.toLowerCase()
      ) === index;
    });

  if (normalizedQueries.length <= 1) {
    const query = normalizedQueries[0] ?? "";
    return (
      queryBuilder as { ilike: (column: string, pattern: string) => TQuery }
    ).ilike("search_name", `%${query}%`);
  }

  const filters = normalizedQueries
    .map((query) => `search_name.ilike.${encodeLikeValue(query)}`)
    .join(",");
  return (queryBuilder as { or: (filters: string) => TQuery }).or(filters);
}

function encodeLikeValue(query: string) {
  return `%${query}%`;
}

export async function findTitleById(
  client: AdminClient,
  titleId: string,
): Promise<CachedTitleRow | null> {
  const { data, error } = await client
    .from("titles")
    .select(
      "id, kind, source, external_id, slug, name, search_name, cover_image_url, earliest_release_date, platforms, search_updated_at, description, genres, developers, publishers, website_url, releases, detail_updated_at, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top",
    )
    .eq("id", titleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CachedTitleRow | null) ?? null;
}

export async function upsertSearchResults(
  client: AdminClient,
  results: TitleSummary[],
  now: string,
): Promise<string | null> {
  const { error } = await client.from("titles").upsert(
    results.map((result) => mapSummaryToSearchUpsertRow(result, now)),
    { onConflict: "source,external_id" },
  );

  return error?.message ?? null;
}

export async function upsertDetailResult(
  client: AdminClient,
  detail: TitleDetails,
  now: string,
): Promise<string | null> {
  const { error } = await client
    .from("titles")
    .upsert(mapDetailToUpsertRow(detail, now), {
      onConflict: "source,external_id",
    });

  return error?.message ?? null;
}

const TITLE_LIST_SELECT =
  "id, kind, source, external_id, slug, name, search_name, cover_image_url, earliest_release_date, platforms, search_updated_at, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top";

export async function listUpcomingTitles(
  client: AdminClient,
  todayIsoDate: string,
  limit: number,
): Promise<TitleSummary[]> {
  const { data, error } = await client
    .from("titles")
    .select(TITLE_LIST_SELECT)
    .gte("earliest_release_date", todayIsoDate)
    .order("earliest_release_date", { ascending: true, nullsFirst: false })
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map(mapCachedRowToTitleSummary);
}

export async function listLatestTitles(
  client: AdminClient,
  earliestIsoDate: string,
  latestIsoDate: string,
  limit: number,
): Promise<TitleSummary[]> {
  const { data, error } = await client
    .from("titles")
    .select(TITLE_LIST_SELECT)
    .gte("earliest_release_date", earliestIsoDate)
    .lte("earliest_release_date", latestIsoDate)
    .order("earliest_release_date", { ascending: false, nullsFirst: false })
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map(mapCachedRowToTitleSummary);
}

export async function listPopularTitles(
  client: AdminClient,
  limit: number,
): Promise<TitleSummary[]> {
  const { data, error } = await client
    .from("titles")
    .select(TITLE_LIST_SELECT)
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .order("rawg_ratings_count", { ascending: false, nullsFirst: false })
    .order("rawg_metacritic", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map(mapCachedRowToTitleSummary);
}
