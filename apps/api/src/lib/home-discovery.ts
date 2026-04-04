import type { HomeDiscoveryResult, TitleSummary } from "@repo/types";

import type { Database } from "@shared/database-types";
import { queryCachedTitles } from "./postgres";

const DISCOVERY_LIMIT = 10;
const LATEST_WINDOW_DAYS = 60;

type CachedTitleRow = Database["public"]["Tables"]["titles"]["Row"];

const TITLE_LIST_SELECT =
  "id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top";

export async function getHomeDiscovery(): Promise<
  HomeDiscoveryResult<TitleSummary>
> {
  const today = new Date();
  const todayIsoDate = toIsoDate(today);
  const latestCutoffIsoDate = toIsoDate(addDays(today, -LATEST_WINDOW_DAYS));
  const [upcoming, latest, popular] = await Promise.all([
    listUpcomingTitles(todayIsoDate, DISCOVERY_LIMIT),
    listLatestTitles(latestCutoffIsoDate, todayIsoDate, DISCOVERY_LIMIT),
    listPopularTitles(DISCOVERY_LIMIT),
  ]);

  return {
    upcoming,
    latest,
    popular,
  };
}

async function listUpcomingTitles(
  todayIsoDate: string,
  limit: number,
): Promise<TitleSummary[]> {
  const rows = await queryCachedTitles(
    `
      select ${TITLE_LIST_SELECT}
      from titles
      where earliest_release_date >= $1
      order by earliest_release_date asc nulls last, rawg_added desc nulls last
      limit $2
    `,
    [todayIsoDate, limit],
  );

  return rows.map(mapCachedRowToTitleSummary);
}

async function listLatestTitles(
  earliestIsoDate: string,
  latestIsoDate: string,
  limit: number,
): Promise<TitleSummary[]> {
  const rows = await queryCachedTitles(
    `
      select ${TITLE_LIST_SELECT}
      from titles
      where earliest_release_date >= $1
        and earliest_release_date <= $2
      order by earliest_release_date desc nulls last, rawg_added desc nulls last
      limit $3
    `,
    [earliestIsoDate, latestIsoDate, limit],
  );

  return rows.map(mapCachedRowToTitleSummary);
}

async function listPopularTitles(limit: number): Promise<TitleSummary[]> {
  const rows = await queryCachedTitles(
    `
      select ${TITLE_LIST_SELECT}
      from titles
      order by rawg_added desc nulls last,
               rawg_ratings_count desc nulls last,
               rawg_metacritic desc nulls last
      limit $1
    `,
    [limit],
  );

  return rows.map(mapCachedRowToTitleSummary);
}

function mapCachedRowToTitleSummary(row: CachedTitleRow): TitleSummary {
  return {
    id: row.id,
    kind: assertTitleKind(row.kind),
    source: assertTitleSource(row.source),
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
  };
}

function parsePlatforms(value: unknown): TitleSummary["platforms"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }

    return [{ id: record.id, name: record.name }];
  });
}

function assertTitleKind(value: string): TitleSummary["kind"] {
  if (value !== "game") {
    throw new Error(`Unsupported title kind: ${value}`);
  }

  return value;
}

function assertTitleSource(value: string): TitleSummary["source"] {
  if (value !== "rawg") {
    throw new Error(`Unsupported title source: ${value}`);
  }

  return value;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
