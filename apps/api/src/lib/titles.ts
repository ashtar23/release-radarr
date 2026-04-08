import type { TitleDetails } from "@repo/types";

import type { Database } from "@shared/database-types";
import type { TitleDetailsResult } from "./contracts";
import { getPostgresPool } from "./postgres";

type TitleRow = Database["public"]["Tables"]["titles"]["Row"];
type TitleDetailsRow = TitleRow & { is_in_watchlist: boolean };

export async function getTitleDetails(
  titleId: string,
  userId?: string | null,
): Promise<TitleDetailsResult | null> {
  const normalizedTitleId = titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("Title id is required.");
  }

  const pool = getPostgresPool();
  const result = await pool.query<TitleDetailsRow>(
    `
      select
        t.id,
        t.kind,
        t.source,
        t.external_id,
        t.slug,
        t.name,
        t.cover_image_url,
        t.earliest_release_date,
        t.description,
        t.genres,
        t.developers,
        t.publishers,
        t.website_url,
        t.platforms,
        t.releases,
        t.rawg_rating,
        t.rawg_ratings_count,
        t.rawg_metacritic,
        t.rawg_added,
        t.rawg_reviews_count,
        t.rawg_suggestions_count,
        t.rawg_rating_top,
        case
          when $2::uuid is null then false
          else exists (
            select 1
            from public.watchlists w
            where w.user_id = $2::uuid
              and w.title_id = t.id
          )
        end as is_in_watchlist
      from public.titles t
      where t.id = $1::text
      limit 1
    `,
    [normalizedTitleId, userId ?? null],
  );

  const row = result.rows[0];
  return row
    ? {
        details: mapTitleRowToDetails(row),
        isInWatchlist: row.is_in_watchlist,
      }
    : null;
}

function mapTitleRowToDetails(row: TitleRow | TitleDetailsRow): TitleDetails {
  assertTitleRow(row);

  return {
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
    description: row.description,
    genres: row.genres ?? [],
    developers: row.developers ?? [],
    publishers: row.publishers ?? [],
    websiteUrl: row.website_url,
    releases: parseReleases(row.releases),
  };
}

function assertTitleRow(row: TitleRow): asserts row is TitleRow & {
  id: string;
  kind: "game";
  source: "rawg";
  external_id: string;
  slug: string;
  name: string;
} {
  if (
    typeof row.id !== "string" ||
    row.kind !== "game" ||
    row.source !== "rawg" ||
    typeof row.external_id !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.name !== "string"
  ) {
    throw new Error("Title row is invalid.");
  }
}

function parsePlatforms(value: unknown): TitleDetails["platforms"] {
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

function parseReleases(value: unknown): TitleDetails["releases"] {
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

function toIsoDateOrNull(value: unknown) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === "string" ? value : null;
}
