import type {
  AdminClient,
  CachedTitleRow,
  PlatformRelease,
  WatchlistInsertRow,
  WatchlistItem,
  WatchlistRow,
} from "../types.ts";
import { mapCachedRowToTitleSummary } from "../mapping/titles.ts";

interface WatchlistJoinedRow extends WatchlistRow {
  titles: CachedTitleRow | null;
}

export async function listWatchlistItems(
  client: AdminClient,
  userId: string,
): Promise<WatchlistItem[]> {
  const { data, error } = await client
    .from("watchlists")
    .select(
      "id, user_id, title_id, created_at, titles!inner(id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, releases, created_at, updated_at, search_updated_at, detail_updated_at, description, genres, developers, publishers, website_url, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as WatchlistJoinedRow[])
    .filter((row) => row.titles !== null)
    .map(mapWatchlistItem);
}

export async function upsertWatchlistItem(
  client: AdminClient,
  userId: string,
  titleId: string,
): Promise<WatchlistItem | null> {
  const now = new Date().toISOString();
  const row: WatchlistInsertRow = {
    id: `${userId}:${titleId}`,
    user_id: userId,
    title_id: titleId,
    created_at: now,
  };

  const { error } = await client.from("watchlists").upsert(row, {
    onConflict: "user_id,title_id",
  });
  if (error) {
    throw new Error(error.message);
  }

  return findWatchlistItem(client, userId, titleId);
}

export async function findWatchlistItem(
  client: AdminClient,
  userId: string,
  titleId: string,
): Promise<WatchlistItem | null> {
  const { data, error } = await client
    .from("watchlists")
    .select(
      "id, user_id, title_id, created_at, titles!inner(id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, releases, created_at, updated_at, search_updated_at, detail_updated_at, description, genres, developers, publishers, website_url, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top)",
    )
    .eq("user_id", userId)
    .eq("title_id", titleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !(data as unknown as WatchlistJoinedRow).titles) {
    return null;
  }

  return mapWatchlistItem(data as unknown as WatchlistJoinedRow);
}

export async function removeWatchlistItem(
  client: AdminClient,
  userId: string,
  titleId: string,
): Promise<void> {
  const { error } = await client
    .from("watchlists")
    .delete()
    .eq("user_id", userId)
    .eq("title_id", titleId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function titleExists(
  client: AdminClient,
  titleId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("titles")
    .select("id")
    .eq("id", titleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

function mapWatchlistItem(row: WatchlistJoinedRow): WatchlistItem {
  if (!row.titles) {
    throw new Error("Watchlist row is missing title.");
  }

  return {
    id: row.id,
    title: mapCachedRowToTitleSummary(row.titles),
    releases: parseReleases(row.titles.releases),
    addedAt: row.created_at,
  };
}

function parseReleases(value: unknown): PlatformRelease[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (
      typeof record.platformId !== "string" ||
      typeof record.platformName !== "string"
    ) {
      return [];
    }

    const releaseDate =
      typeof record.releaseDate === "string" ? record.releaseDate : null;
    const releaseDatePrecision =
      record.releaseDatePrecision === "day" ||
      record.releaseDatePrecision === "month" ||
      record.releaseDatePrecision === "year" ||
      record.releaseDatePrecision === "unknown"
        ? record.releaseDatePrecision
        : "unknown";

    return [
      {
        platformId: record.platformId,
        platformName: record.platformName,
        releaseDate,
        releaseDatePrecision,
      },
    ];
  });
}
