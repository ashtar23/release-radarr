import type { HomeDiscoveryResult, TitleSummary } from "@repo/types";
import type { Database } from "@/types/database";
import { env } from "./env";
import { fetchRawgDiscoveryResults } from "./rawg";
import { supabaseAdmin } from "./supabase";

const DISCOVERY_LIMIT = 10;
const LOCAL_MIN_RESULTS = 6;
const LATEST_WINDOW_DAYS = 60;
const UPCOMING_WINDOW_DAYS = 365;

type CachedTitleRow = Database["public"]["Tables"]["titles"]["Row"];
type TitleInsertRow = Database["public"]["Tables"]["titles"]["Insert"];

const TITLE_LIST_SELECT =
  "id, kind, source, external_id, slug, name, search_name, cover_image_url, earliest_release_date, platforms, search_updated_at, rawg_rating, rawg_ratings_count, rawg_metacritic, rawg_added, rawg_reviews_count, rawg_suggestions_count, rawg_rating_top";

export async function getHomeDiscovery(): Promise<
  HomeDiscoveryResult<TitleSummary>
> {
  const rawgApiKey = env.rawgApiKey;
  const today = new Date();
  const todayIsoDate = toIsoDate(today);
  const latestCutoffIsoDate = toIsoDate(addDays(today, -LATEST_WINDOW_DAYS));
  const upcomingCutoffIsoDate = toIsoDate(addDays(today, UPCOMING_WINDOW_DAYS));

  const [localUpcoming, localLatest, localPopular] = await Promise.all([
    listUpcomingTitles(todayIsoDate, DISCOVERY_LIMIT),
    listLatestTitles(latestCutoffIsoDate, todayIsoDate, DISCOVERY_LIMIT),
    listPopularTitles(DISCOVERY_LIMIT),
  ]);

  const [upcoming, latest, popular] = await Promise.all([
    resolveDiscoverySection({
      localResults: localUpcoming,
      fallback:
        rawgApiKey == null
          ? null
          : () =>
              fetchRawgDiscoveryResults({
                rawgApiKey,
                pageSize: DISCOVERY_LIMIT,
                dates: `${todayIsoDate},${upcomingCutoffIsoDate}`,
                ordering: "released",
              }),
    }),
    resolveDiscoverySection({
      localResults: localLatest,
      fallback:
        rawgApiKey == null
          ? null
          : () =>
              fetchRawgDiscoveryResults({
                rawgApiKey,
                pageSize: DISCOVERY_LIMIT,
                dates: `${latestCutoffIsoDate},${todayIsoDate}`,
                ordering: "-released",
              }),
    }),
    resolveDiscoverySection({
      localResults: localPopular,
      fallback:
        rawgApiKey == null
          ? null
          : () =>
              fetchRawgDiscoveryResults({
                rawgApiKey,
                pageSize: DISCOVERY_LIMIT,
                ordering: "-added",
              }),
    }),
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
  const { data, error } = await supabaseAdmin
    .from("titles")
    .select(TITLE_LIST_SELECT)
    .gte("earliest_release_date", todayIsoDate)
    .order("earliest_release_date", { ascending: true, nullsFirst: false })
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map(mapCachedRowToTitleSummary);
}

async function listLatestTitles(
  earliestIsoDate: string,
  latestIsoDate: string,
  limit: number,
): Promise<TitleSummary[]> {
  const { data, error } = await supabaseAdmin
    .from("titles")
    .select(TITLE_LIST_SELECT)
    .gte("earliest_release_date", earliestIsoDate)
    .lte("earliest_release_date", latestIsoDate)
    .order("earliest_release_date", { ascending: false, nullsFirst: false })
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map(mapCachedRowToTitleSummary);
}

async function listPopularTitles(limit: number): Promise<TitleSummary[]> {
  const { data, error } = await supabaseAdmin
    .from("titles")
    .select(TITLE_LIST_SELECT)
    .order("rawg_added", { ascending: false, nullsFirst: false })
    .order("rawg_ratings_count", { ascending: false, nullsFirst: false })
    .order("rawg_metacritic", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CachedTitleRow[]).map(mapCachedRowToTitleSummary);
}

async function resolveDiscoverySection(params: {
  localResults: TitleSummary[];
  fallback: (() => Promise<TitleSummary[]>) | null;
}) {
  if (
    params.localResults.length >= LOCAL_MIN_RESULTS ||
    params.fallback === null
  ) {
    return params.localResults.slice(0, DISCOVERY_LIMIT);
  }

  const providerResults = await params.fallback().catch(() => []);
  if (providerResults.length > 0) {
    await upsertSearchResults(providerResults, new Date().toISOString());
  }

  return dedupeTitles([...params.localResults, ...providerResults]).slice(
    0,
    DISCOVERY_LIMIT,
  );
}

async function upsertSearchResults(results: TitleSummary[], now: string) {
  const { error } = await supabaseAdmin.from("titles").upsert(
    results.map((result) => mapSummaryToSearchUpsertRow(result, now)),
    { onConflict: "source,external_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
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

function mapSummaryToSearchUpsertRow(
  summary: TitleSummary,
  now: string,
): TitleInsertRow {
  return {
    id: summary.id,
    kind: summary.kind,
    source: summary.source,
    external_id: summary.externalId,
    slug: summary.slug,
    name: summary.name,
    search_name: normalizeSearchKey(summary.name),
    cover_image_url: summary.coverImageUrl,
    earliest_release_date: summary.earliestReleaseDate,
    platforms: summary.platforms as unknown as TitleInsertRow["platforms"],
    rawg_rating: summary.rawgRating,
    rawg_ratings_count: summary.rawgRatingsCount,
    rawg_metacritic: summary.rawgMetacritic,
    rawg_added: summary.rawgAdded,
    rawg_reviews_count: summary.rawgReviewsCount,
    rawg_suggestions_count: summary.rawgSuggestionsCount,
    rawg_rating_top: summary.rawgRatingTop,
    search_updated_at: now,
    updated_at: now,
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

function normalizeSearchKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/([a-z0-9])['’]s\b/g, "$1s")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function dedupeTitles(results: TitleSummary[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }

    seen.add(result.id);
    return true;
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
