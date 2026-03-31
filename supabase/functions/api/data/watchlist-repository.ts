import type {
  AdminClient,
  PlatformRelease,
  WatchlistInsertRow,
  WatchlistItem,
  WatchlistRow,
  WatchlistViewRow,
} from "../types.ts";

export type WatchlistSort =
  | "added-desc"
  | "added-asc"
  | "release-desc"
  | "release-asc"
  | "name-asc"
  | "name-desc";

export async function listWatchlistItems(
  client: AdminClient,
  userId: string,
  sort: WatchlistSort,
): Promise<WatchlistItem[]> {
  const baseQuery = client.from("watchlist_items").select("*").eq("user_id", userId);

  const query = (() => {
    switch (sort) {
      case "added-asc":
        return baseQuery
          .order("added_at", { ascending: true })
          .order("id", { ascending: true });
      case "release-asc":
        return baseQuery.order("earliest_release_date", {
          ascending: true,
          nullsFirst: false,
        });
      case "release-desc":
        return baseQuery.order("earliest_release_date", {
          ascending: false,
          nullsFirst: false,
        });
      case "name-asc":
        return baseQuery
          .order("name", { ascending: true })
          .order("id", { ascending: true });
      case "name-desc":
        return baseQuery
          .order("name", { ascending: false })
          .order("id", { ascending: true });
      case "added-desc":
      default:
        return baseQuery
          .order("added_at", { ascending: false })
          .order("id", { ascending: true });
    }
  })();

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WatchlistViewRow[]).map(mapWatchlistItem);
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
    .from("watchlist_items")
    .select("*")
    .eq("user_id", userId)
    .eq("title_id", titleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapWatchlistItem(data as WatchlistViewRow);
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

function mapWatchlistItem(row: WatchlistViewRow): WatchlistItem {
  assertWatchlistViewRow(row);
  return {
    id: row.id,
    title: {
      id: row.title_id,
      kind: row.kind,
      source: row.source,
      externalId: row.external_id,
      slug: row.slug,
      name: row.name,
      coverImageUrl: row.cover_image_url,
      earliestReleaseDate: row.earliest_release_date,
      platforms: parsePlatforms(row.platforms),
      rawgRating: row.rawg_rating,
      rawgRatingsCount: row.rawg_ratings_count,
      rawgMetacritic: row.rawg_metacritic,
      rawgAdded: row.rawg_added,
      rawgReviewsCount: row.rawg_reviews_count,
      rawgSuggestionsCount: row.rawg_suggestions_count,
      rawgRatingTop: row.rawg_rating_top,
    },
    releases: parseReleases(row.releases),
    addedAt: row.added_at,
  };
}

function assertWatchlistViewRow(
  row: WatchlistViewRow,
): asserts row is WatchlistViewRow & {
  id: string;
  title_id: string;
  kind: "game";
  source: "rawg";
  external_id: string;
  slug: string;
  name: string;
  added_at: string;
} {
  if (
    typeof row.id !== "string" ||
    typeof row.title_id !== "string" ||
    row.kind !== "game" ||
    row.source !== "rawg" ||
    typeof row.external_id !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.name !== "string" ||
    typeof row.added_at !== "string"
  ) {
    throw new Error("Watchlist view row is invalid.");
  }
}

function parsePlatforms(value: unknown) {
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
