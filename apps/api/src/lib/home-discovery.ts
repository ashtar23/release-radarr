import type { TitleSummary } from "@repo/types";

import type { Database } from "@shared/database-types";
import type { HomeDiscoveryPageResult, HomeDiscoveryResult } from "./contracts";
import {
  buildHomeDiscoveryPageResult,
  decodeHomeDiscoveryCursor,
  normalizeHomeDiscoveryPageLimit,
  type HomeDiscoverySection,
} from "./home-discovery-page";
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
const HOME_PAGE_WINDOW_LIMIT = 365;

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

export async function listHomeDiscoverySectionPage(
  section: HomeDiscoverySection,
  options: {
    cursor?: string;
    limit?: number;
  } = {},
): Promise<HomeDiscoveryPageResult> {
  const today = new Date();
  const todayIsoDate = toIsoDate(today);
  const limit = normalizeHomeDiscoveryPageLimit(options.limit);

  switch (section) {
    case "upcoming":
      return listUpcomingPage({
        todayIsoDate,
        latestIsoDate: toIsoDate(addDays(today, HOME_PAGE_WINDOW_LIMIT)),
        cursor: options.cursor,
        limit,
      });
    case "latest":
      return listLatestPage({
        earliestIsoDate: toIsoDate(addDays(today, -LATEST_WINDOW_DAYS)),
        latestIsoDate: todayIsoDate,
        cursor: options.cursor,
        limit,
      });
    case "popular":
      return listPopularPage({
        earliestIsoDate: toIsoDate(addDays(today, -POPULAR_LOOKBACK_DAYS)),
        latestIsoDate: toIsoDate(addDays(today, POPULAR_LOOKAHEAD_DAYS)),
        cursor: options.cursor,
        limit,
      });
  }
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

async function listUpcomingPage(params: {
  todayIsoDate: string;
  latestIsoDate: string;
  cursor?: string;
  limit: number;
}): Promise<HomeDiscoveryPageResult> {
  const cursor = params.cursor
    ? decodeHomeDiscoveryCursor(params.cursor, "upcoming")
    : null;
  const rows = await queryCachedTitles(
    `
      select ${TITLE_LIST_SELECT}
      from titles
      where earliest_release_date >= $1
        and earliest_release_date <= $2
        and cover_image_url is not null
        and jsonb_array_length(platforms) > 0
        and (
          coalesce(rawg_added, 0) >= 10
          or coalesce(rawg_suggestions_count, 0) >= 40
          or coalesce(rawg_ratings_count, 0) >= 3
        )
        and (
          $3::date is null
          or earliest_release_date > $3::date
          or (
            earliest_release_date = $3::date
            and coalesce(rawg_added, 0) < $4::integer
          )
          or (
            earliest_release_date = $3::date
            and coalesce(rawg_added, 0) = $4::integer
            and id > $5::text
          )
        )
      order by earliest_release_date asc,
               coalesce(rawg_added, 0) desc,
               id asc
      limit $6
    `,
    [
      params.todayIsoDate,
      params.latestIsoDate,
      cursor?.date ?? null,
      cursor?.added ?? 0,
      cursor?.id ?? "",
      params.limit + 1,
    ],
  );

  return buildHomeDiscoveryPageResult({
    section: "upcoming",
    rows: rows.map(mapCachedRowToTitleSummary),
    limit: params.limit,
  });
}

async function listLatestPage(params: {
  earliestIsoDate: string;
  latestIsoDate: string;
  cursor?: string;
  limit: number;
}): Promise<HomeDiscoveryPageResult> {
  const cursor = params.cursor
    ? decodeHomeDiscoveryCursor(params.cursor, "latest")
    : null;
  const rows = await queryCachedTitles(
    `
      select ${TITLE_LIST_SELECT}
      from titles
      where earliest_release_date >= $1
        and earliest_release_date <= $2
        and cover_image_url is not null
        and jsonb_array_length(platforms) > 0
        and (
          coalesce(rawg_added, 0) >= 8
          or coalesce(rawg_reviews_count, 0) >= 2
          or coalesce(rawg_suggestions_count, 0) >= 15
        )
        and (
          $3::date is null
          or earliest_release_date < $3::date
          or (
            earliest_release_date = $3::date
            and coalesce(rawg_added, 0) < $4::integer
          )
          or (
            earliest_release_date = $3::date
            and coalesce(rawg_added, 0) = $4::integer
            and id < $5::text
          )
        )
      order by earliest_release_date desc,
               coalesce(rawg_added, 0) desc,
               id desc
      limit $6
    `,
    [
      params.earliestIsoDate,
      params.latestIsoDate,
      cursor?.date ?? null,
      cursor?.added ?? 0,
      cursor?.id ?? "",
      params.limit + 1,
    ],
  );

  return buildHomeDiscoveryPageResult({
    section: "latest",
    rows: rows.map(mapCachedRowToTitleSummary),
    limit: params.limit,
  });
}

async function listPopularPage(params: {
  earliestIsoDate: string;
  latestIsoDate: string;
  cursor?: string;
  limit: number;
}): Promise<HomeDiscoveryPageResult> {
  const cursor = params.cursor
    ? decodeHomeDiscoveryCursor(params.cursor, "popular")
    : null;
  const rows = await queryCachedTitles(
    `
      select ${TITLE_LIST_SELECT}
      from titles
      where earliest_release_date >= $1
        and earliest_release_date <= $2
        and cover_image_url is not null
        and jsonb_array_length(platforms) > 0
        and (
          coalesce(rawg_added, 0) >= 25
          or coalesce(rawg_suggestions_count, 0) >= 50
          or coalesce(rawg_ratings_count, 0) >= 5
        )
        and (
          $3::integer is null
          or coalesce(rawg_added, 0) < $3::integer
          or (
            coalesce(rawg_added, 0) = $3::integer
            and coalesce(rawg_ratings_count, 0) < $4::integer
          )
          or (
            coalesce(rawg_added, 0) = $3::integer
            and coalesce(rawg_ratings_count, 0) = $4::integer
            and coalesce(rawg_suggestions_count, 0) < $5::integer
          )
          or (
            coalesce(rawg_added, 0) = $3::integer
            and coalesce(rawg_ratings_count, 0) = $4::integer
            and coalesce(rawg_suggestions_count, 0) = $5::integer
            and id < $6::text
          )
        )
      order by coalesce(rawg_added, 0) desc,
               coalesce(rawg_ratings_count, 0) desc,
               coalesce(rawg_suggestions_count, 0) desc,
               id desc
      limit $7
    `,
    [
      params.earliestIsoDate,
      params.latestIsoDate,
      cursor?.added ?? null,
      cursor?.ratingsCount ?? 0,
      cursor?.suggestionsCount ?? 0,
      cursor?.id ?? "",
      params.limit + 1,
    ],
  );

  return buildHomeDiscoveryPageResult({
    section: "popular",
    rows: rows.map(mapCachedRowToTitleSummary),
    limit: params.limit,
  });
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
    earliestReleaseDate: toIsoDateOrNull(row.earliest_release_date),
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

function toIsoDateOrNull(value: unknown) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === "string" ? value.slice(0, 10) : null;
}
