import type {
  AdminClient,
  PlatformRelease,
  WatchlistListResult,
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

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

export interface ListWatchlistParams {
  readonly sort: WatchlistSort;
  readonly cursor?: string;
  readonly limit?: number;
}

export async function listWatchlistItems(
  client: AdminClient,
  userId: string,
  params: ListWatchlistParams,
): Promise<WatchlistListResult> {
  const pageLimit = normalizeLimit(params.limit);
  const decodedCursor = params.cursor
    ? decodeCursor(params.cursor, params.sort)
    : null;
  const { data, error } = await client.rpc("list_watchlist_items_page", {
    p_user_id: userId,
    p_sort: params.sort,
    p_limit: pageLimit,
    p_added_at_cursor:
      decodedCursor &&
      (decodedCursor.sort === "added-asc" ||
        decodedCursor.sort === "added-desc")
        ? decodedCursor.value
        : null,
    p_id_cursor: decodedCursor?.id ?? null,
    p_search_name_cursor:
      decodedCursor &&
      (decodedCursor.sort === "name-asc" || decodedCursor.sort === "name-desc")
        ? decodedCursor.value
        : null,
    p_release_date_cursor:
      decodedCursor &&
      (decodedCursor.sort === "release-asc" ||
        decodedCursor.sort === "release-desc")
        ? decodedCursor.value
        : null,
    p_release_bucket_cursor:
      decodedCursor &&
      (decodedCursor.sort === "release-asc" ||
        decodedCursor.sort === "release-desc")
        ? decodedCursor.bucket
        : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as WatchlistViewRow[];
  const pageRows = rows.slice(0, pageLimit);
  const nextCursor =
    rows.length > pageLimit
      ? encodeCursor(pageRows[pageRows.length - 1]!, params.sort)
      : null;

  return {
    items: pageRows.map(mapWatchlistItem),
    nextCursor,
  };
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

function normalizeLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || limit == null) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT);
}

type DecodedCursor =
  | {
      sort: "added-asc" | "added-desc";
      value: string;
      id: string;
    }
  | {
      sort: "release-asc" | "release-desc";
      bucket: 0 | 1;
      value: string | null;
      id: string;
    }
  | {
      sort: "name-asc" | "name-desc";
      value: string;
      id: string;
    };

function encodeCursor(row: WatchlistViewRow, sort: WatchlistSort) {
  assertWatchlistViewRow(row);
  const releaseSortBucket = row.release_sort_bucket === 1 ? 1 : 0;
  const payload =
    sort === "added-asc" || sort === "added-desc"
      ? { sort, value: row.added_at, id: row.id }
      : sort === "release-asc" || sort === "release-desc"
        ? {
            sort,
            bucket: releaseSortBucket,
            value: row.earliest_release_date,
            id: row.id,
          }
        : { sort, value: row.search_name, id: row.id };

  return toBase64Url(JSON.stringify(payload));
}

function decodeCursor(
  cursor: string,
  sort: WatchlistSort,
): DecodedCursor | null {
  try {
    const parsed = JSON.parse(fromBase64Url(cursor)) as Record<string, unknown>;
    if (!parsed || parsed.sort !== sort || typeof parsed.id !== "string") {
      return null;
    }

    switch (sort) {
      case "added-asc":
      case "added-desc":
      case "name-asc":
      case "name-desc":
        if (typeof parsed.value !== "string") {
          return null;
        }

        return {
          sort,
          value: parsed.value,
          id: parsed.id,
        };
      case "release-asc":
      case "release-desc":
        if (parsed.bucket !== 0 && parsed.bucket !== 1) {
          return null;
        }

        if (parsed.value !== null && typeof parsed.value !== "string") {
          return null;
        }

        return {
          sort,
          bucket: parsed.bucket,
          value: parsed.value ?? null,
          id: parsed.id,
        };
    }
  } catch {
    return null;
  }
}

function toBase64Url(value: string) {
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padding = (4 - (value.length % 4 || 4)) % 4;
  const normalized =
    value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(padding);
  return atob(normalized);
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
  search_name: string;
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
    typeof row.search_name !== "string" ||
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
