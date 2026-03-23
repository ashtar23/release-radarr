import type {
  AdminClient,
  CachedTitleRow,
  LocalSearchResult,
  TitleDetails,
  TitleSummary,
} from "../types.ts";
import {
  mapCachedRowToTitleSummary,
  mapDetailToUpsertRow,
  mapSummaryToSearchUpsertRow,
} from "../mapping/titles.ts";

export interface LocalResultsPage {
  results: LocalSearchResult[];
}

export async function findLocalResultsPage(
  client: AdminClient,
  query: string,
  page: number,
  limit: number,
): Promise<LocalResultsPage> {
  const candidateSize = Math.min(Math.max(page * limit * 5, 120), 1000);
  const from = 0;
  const to = candidateSize - 1;
  const { data, error } = await client
    .from("titles")
    .select(
      "id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, search_updated_at, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top",
    )
    .ilike("name", `%${query}%`)
    .order("rawg_metacritic", { ascending: false, nullsFirst: false })
    .order("rawg_ratings_count", { ascending: false, nullsFirst: false })
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    results: ((data ?? []) as CachedTitleRow[]).map((row) => ({
      summary: mapCachedRowToTitleSummary(row),
      searchUpdatedAt: row.search_updated_at,
    })),
  };
}

export async function countLocalResults(
  client: AdminClient,
  query: string,
): Promise<number> {
  const { error, count } = await client
    .from("titles")
    .select("id", { count: "exact", head: true })
    .ilike("name", `%${query}%`);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function findTitleById(
  client: AdminClient,
  titleId: string,
): Promise<CachedTitleRow | null> {
  const { data, error } = await client
    .from("titles")
    .select(
      "id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, search_updated_at, description, genres, developers, publishers, website_url, releases, detail_updated_at, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top",
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
