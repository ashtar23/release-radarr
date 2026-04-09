import type { TitleSummary } from "@repo/types";

import type { Database } from "@shared/database-types";
import type { HomeDiscoveryResult } from "./contracts";
import { selectHomeDiscoveryRails } from "./home-discovery-selection";
import { queryCachedTitles } from "./postgres";

const DISCOVERY_LIMIT = 10;
const UPCOMING_WINDOW_DAYS = 365;
const LATEST_WINDOW_DAYS = 45;
const POPULAR_LOOKBACK_DAYS = 30;
const POPULAR_LOOKAHEAD_DAYS = 365;
const UPCOMING_POOL_LIMIT = 60;
const LATEST_POOL_LIMIT = 60;
const POPULAR_POOL_LIMIT = 80;

type CachedTitleRow = Database["public"]["Tables"]["titles"]["Row"];

const TITLE_LIST_SELECT =
  "id, kind, source, external_id, slug, name, cover_image_url, earliest_release_date, platforms, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top";

export async function getHomeDiscovery(): Promise<HomeDiscoveryResult> {
  const today = new Date();
  const todayIsoDate = toIsoDate(today);
  const latestCutoffIsoDate = toIsoDate(addDays(today, -LATEST_WINDOW_DAYS));
  const upcomingCutoffIsoDate = toIsoDate(addDays(today, UPCOMING_WINDOW_DAYS));
  const popularLookbackIsoDate = toIsoDate(
    addDays(today, -POPULAR_LOOKBACK_DAYS),
  );
  const popularLookaheadIsoDate = toIsoDate(
    addDays(today, POPULAR_LOOKAHEAD_DAYS),
  );
  const [upcoming, latest, popular] = await Promise.all([
    listUpcomingTitles(
      todayIsoDate,
      upcomingCutoffIsoDate,
      UPCOMING_POOL_LIMIT,
    ),
    listLatestTitles(latestCutoffIsoDate, todayIsoDate, LATEST_POOL_LIMIT),
    listPopularTitles(
      popularLookbackIsoDate,
      popularLookaheadIsoDate,
      POPULAR_POOL_LIMIT,
    ),
  ]);

  return selectHomeDiscoveryRails({
    upcomingCandidates: upcoming,
    latestCandidates: latest,
    popularCandidates: popular,
    todayIsoDate,
    limit: DISCOVERY_LIMIT,
  });
}

async function listUpcomingTitles(
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
      order by earliest_release_date asc nulls last, rawg_added desc nulls last
      limit $3
    `,
    [earliestIsoDate, latestIsoDate, limit],
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

async function listPopularTitles(
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
      order by rawg_added desc nulls last,
               rawg_ratings_count desc nulls last,
               rawg_metacritic desc nulls last
      limit $3
    `,
    [earliestIsoDate, latestIsoDate, limit],
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
