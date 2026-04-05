import type {
  WatchlistItem,
  WatchlistListResult,
  WatchlistMembershipResult,
  WatchlistSort,
  WatchlistUpsertResult,
} from "@repo/types";

import type { Database } from "@shared/database-types";
import { getPostgresPool } from "./postgres";

type WatchlistViewRow = Database["public"]["Views"]["watchlist_items"]["Row"];
type TitleRow = Database["public"]["Tables"]["titles"]["Row"];

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

export interface ListWatchlistOptions {
  readonly sort?: WatchlistSort;
  readonly query?: string;
  readonly cursor?: string;
  readonly limit?: number;
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

export async function listWatchlistItems(
  userId: string,
  options: ListWatchlistOptions = {},
): Promise<WatchlistListResult> {
  const pool = getPostgresPool();
  const sort = options.sort ?? "added-desc";
  const limit = normalizeLimit(options.limit);
  const query = normalizeQuery(options.query);
  const cursor = options.cursor ? decodeCursor(options.cursor, sort) : null;

  const result = await pool.query<WatchlistViewRow>(
    `
      select *
      from public.list_watchlist_items_page(
        p_user_id => $1::uuid,
        p_sort => $2::text,
        p_query => $3::text,
        p_limit => $4::integer,
        p_added_at_cursor => $5::timestamptz,
        p_id_cursor => $6::text,
        p_search_name_cursor => $7::text,
        p_release_date_cursor => $8::date,
        p_release_bucket_cursor => $9::integer
      )
    `,
    [
      userId,
      sort,
      query,
      limit,
      cursor && (cursor.sort === "added-asc" || cursor.sort === "added-desc")
        ? cursor.value
        : null,
      cursor?.id ?? null,
      cursor && (cursor.sort === "name-asc" || cursor.sort === "name-desc")
        ? cursor.value
        : null,
      cursor &&
      (cursor.sort === "release-asc" || cursor.sort === "release-desc")
        ? cursor.value
        : null,
      cursor &&
      (cursor.sort === "release-asc" || cursor.sort === "release-desc")
        ? cursor.bucket
        : null,
    ],
  );

  const rows = result.rows;
  const pageRows = rows.slice(0, limit);

  return {
    items: pageRows.map(mapWatchlistItem),
    nextCursor:
      rows.length > limit
        ? encodeCursor(pageRows[pageRows.length - 1]!, sort)
        : null,
  };
}

export async function getWatchlistMembership(
  userId: string,
  titleId: string,
): Promise<WatchlistMembershipResult> {
  const normalizedTitleId = titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  const item = await findWatchlistItem(userId, normalizedTitleId);
  return { isInWatchlist: item != null };
}

export async function addWatchlistItem(
  userId: string,
  titleId: string,
): Promise<WatchlistUpsertResult | null> {
  const normalizedTitleId = titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  const pool = getPostgresPool();
  const now = new Date().toISOString();
  const id = `${userId}:${normalizedTitleId}`;

  await pool.query(
    `
      insert into public.watchlists (id, user_id, title_id, created_at)
      values ($1::text, $2::uuid, $3::text, $4::timestamptz)
      on conflict (user_id, title_id)
      do update set created_at = public.watchlists.created_at
    `,
    [id, userId, normalizedTitleId, now],
  );

  const item = await findWatchlistItem(userId, normalizedTitleId);
  return item ? { item } : null;
}

export async function removeWatchlistItem(
  userId: string,
  titleId: string,
): Promise<void> {
  const normalizedTitleId = titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  const pool = getPostgresPool();
  await pool.query(
    `
      delete from public.watchlists
      where user_id = $1::uuid
        and title_id = $2::text
    `,
    [userId, normalizedTitleId],
  );
}

export async function titleExists(titleId: string): Promise<boolean> {
  const normalizedTitleId = titleId.trim();
  if (!normalizedTitleId) {
    return false;
  }

  const pool = getPostgresPool();
  const result = await pool.query<Pick<TitleRow, "id">>(
    `
      select id
      from public.titles
      where id = $1::text
      limit 1
    `,
    [normalizedTitleId],
  );

  return result.rows.length > 0;
}

async function findWatchlistItem(
  userId: string,
  titleId: string,
): Promise<WatchlistItem | null> {
  const pool = getPostgresPool();
  const result = await pool.query<WatchlistViewRow>(
    `
      select *
      from public.watchlist_items
      where user_id = $1::uuid
        and title_id = $2::text
      limit 1
    `,
    [userId, titleId],
  );

  const row = result.rows[0];
  return row ? mapWatchlistItem(row) : null;
}

function normalizeLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || limit == null) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT);
}

function normalizeQuery(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

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
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string) {
  const padding = (4 - (value.length % 4 || 4)) % 4;
  const normalized =
    value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(padding);
  return Buffer.from(normalized, "base64").toString("utf8");
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

function parsePlatforms(value: unknown): WatchlistItem["title"]["platforms"] {
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

function parseReleases(value: unknown): WatchlistItem["releases"] {
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
