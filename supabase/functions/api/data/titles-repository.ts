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

export async function findLocalResults(
  client: AdminClient,
  query: string,
  limit: number,
): Promise<LocalSearchResult[]> {
  const { data, error } = await client
    .from("titles")
    .select(
      "id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, search_updated_at",
    )
    .ilike("name", `%${query}%`)
    .order("search_updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map((row) => ({
    summary: mapCachedRowToTitleSummary(row),
    searchUpdatedAt: row.search_updated_at,
  }));
}

export async function findTitleById(
  client: AdminClient,
  titleId: string,
): Promise<CachedTitleRow | null> {
  const { data, error } = await client
    .from("titles")
    .select(
      "id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, search_updated_at, description, genres, developers, publishers, website_url, releases, detail_updated_at",
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
