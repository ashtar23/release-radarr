import { createClient } from "@supabase/supabase-js";

interface TitlePlatform {
  id: string;
  name: string;
}

type ReleaseDatePrecision = "day" | "month" | "year" | "unknown";

interface PlatformRelease {
  platformId: string;
  platformName: string;
  releaseDate: string | null;
  releaseDatePrecision: ReleaseDatePrecision;
}

interface TitleSummary {
  id: string;
  kind: "game";
  source: "rawg";
  externalId: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  earliestReleaseDate: string | null;
  platforms: TitlePlatform[];
}

interface TitleSearchResult {
  query: string;
  results: TitleSummary[];
}

interface TitleDetails extends TitleSummary {
  description: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  websiteUrl: string | null;
  releases: PlatformRelease[];
}

interface CachedTitleRow {
  id: string;
  kind: "game";
  source: "rawg";
  external_id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  earliest_release_date: string | null;
  platforms: unknown;
  search_updated_at: string;
  description: string | null;
  genres: string[] | null;
  developers: string[] | null;
  publishers: string[] | null;
  website_url: string | null;
  releases: unknown;
  detail_updated_at: string | null;
}

interface LocalSearchResult {
  summary: TitleSummary;
  searchUpdatedAt: string;
}

interface RawgSearchResponse {
  results?: RawgSearchGame[];
}

interface RawgSearchGame {
  id: number;
  slug: string | null;
  name: string;
  background_image: string | null;
  released: string | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
  }>;
}

interface RawgDetailGame extends RawgSearchGame {
  description_raw?: string | null;
  genres?: Array<{ name?: string }>;
  developers?: Array<{ name?: string }>;
  publishers?: Array<{ name?: string }>;
  website?: string | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
    released_at?: string | null;
  }>;
}

interface ApiErrorPayload {
  error: string;
}

const RAWG_BASE_URL = "https://api.rawg.io/api/games";
const SEARCH_FRESHNESS_DAYS = 7;
const DETAIL_FRESHNESS_HOURS = 24;
const MIN_LOCAL_RESULTS_BEFORE_FALLBACK = 5;
const DEFAULT_LIMIT = 10;
const MIN_QUERY_LENGTH = 2;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const route = resolveRoute(new URL(request.url).pathname);
    if (!route) {
      return jsonResponse({ error: "Not found." }, 404);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing." },
        500,
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(request.url);
    if (route.kind === "search") {
      return handleSearchRequest(admin, url);
    }

    return handleDetailRequest(admin, route.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return jsonResponse({ error: message }, 500);
  }
});

async function handleSearchRequest(
  client: ReturnType<typeof createClient>,
  url: URL,
) {
  const query = url.searchParams.get("query")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return jsonResponse(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
      400,
    );
  }

  const limit = clampLimit(url.searchParams.get("limit"));
  const localResults = await findLocalResults(client, query, limit);
  const weakResultsThreshold = Math.min(limit, MIN_LOCAL_RESULTS_BEFORE_FALLBACK);
  const shouldFallbackToRawg =
    localResults.length < weakResultsThreshold || areSearchResultsStale(localResults);

  if (!shouldFallbackToRawg) {
    return jsonResponse({
      query,
      results: localResults.map((result) => result.summary),
    });
  }

  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    return jsonResponse({
      query,
      results: localResults.map((result) => result.summary),
    });
  }

  let rawgResults: TitleSummary[];
  try {
    rawgResults = await fetchRawgSearchResults(query, limit, rawgApiKey);
  } catch {
    return jsonResponse({
      query,
      results: localResults.map((result) => result.summary),
    });
  }

  if (!rawgResults.length) {
    return jsonResponse({
      query,
      results: localResults.map((result) => result.summary),
    });
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from("titles")
    .upsert(
      rawgResults.map((result) => mapSummaryToSearchUpsertRow(result, now)),
      { onConflict: "source,external_id" },
    );

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ query, results: rawgResults });
}

async function handleDetailRequest(
  client: ReturnType<typeof createClient>,
  titleId: string,
) {
  const localRow = await findTitleById(client, titleId);
  if (localRow && !isDetailStale(localRow)) {
    return jsonResponse(mapCachedRowToTitleDetails(localRow));
  }

  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    if (localRow) {
      return jsonResponse(mapCachedRowToTitleDetails(localRow));
    }
    return jsonResponse({ error: "Title not found." }, 404);
  }

  const rawgExternalId = extractRawgExternalId(titleId, localRow);
  if (!rawgExternalId) {
    if (localRow) {
      return jsonResponse(mapCachedRowToTitleDetails(localRow));
    }
    return jsonResponse({ error: "Title not found." }, 404);
  }

  let normalizedDetail: TitleDetails;
  try {
    normalizedDetail = await fetchRawgDetail(rawgExternalId, rawgApiKey);
  } catch {
    if (localRow) {
      return jsonResponse(mapCachedRowToTitleDetails(localRow));
    }
    return jsonResponse({ error: "Title not found." }, 404);
  }

  const now = new Date().toISOString();
  const { error } = await client
    .from("titles")
    .upsert(mapDetailToUpsertRow(normalizedDetail, now), {
      onConflict: "source,external_id",
    });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse(normalizedDetail);
}

type Route = { kind: "search" } | { kind: "detail"; id: string };

function resolveRoute(pathname: string): Route | null {
  const segments = pathname.split("/").filter(Boolean);
  const titlesIndex = segments.lastIndexOf("titles");
  if (titlesIndex === -1) {
    return null;
  }

  const maybeId = segments[titlesIndex + 1];
  if (!maybeId) {
    return { kind: "search" };
  }

  if (segments.length !== titlesIndex + 2) {
    return null;
  }

  return { kind: "detail", id: decodeURIComponent(maybeId) };
}

async function findLocalResults(
  client: ReturnType<typeof createClient>,
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

async function findTitleById(
  client: ReturnType<typeof createClient>,
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

function mapCachedRowToTitleSummary(row: CachedTitleRow): TitleSummary {
  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    externalId: row.external_id,
    slug: row.slug,
    name: row.name,
    coverImageUrl: row.cover_image_url,
    earliestReleaseDate: row.earliest_release_date,
    platforms: parsePlatforms(row.platforms),
  };
}

function mapCachedRowToTitleDetails(row: CachedTitleRow): TitleDetails {
  const summary = mapCachedRowToTitleSummary(row);
  return {
    ...summary,
    description: row.description,
    genres: row.genres ?? [],
    developers: row.developers ?? [],
    publishers: row.publishers ?? [],
    websiteUrl: row.website_url,
    releases: parseReleases(row.releases),
  };
}

function mapSummaryToSearchUpsertRow(summary: TitleSummary, now: string) {
  return {
    id: summary.id,
    kind: summary.kind,
    source: summary.source,
    external_id: summary.externalId,
    slug: summary.slug,
    name: summary.name,
    cover_image_url: summary.coverImageUrl,
    earliest_release_date: summary.earliestReleaseDate,
    platforms: summary.platforms,
    search_updated_at: now,
    updated_at: now,
  };
}

function mapDetailToUpsertRow(detail: TitleDetails, now: string) {
  return {
    id: detail.id,
    kind: detail.kind,
    source: detail.source,
    external_id: detail.externalId,
    slug: detail.slug,
    name: detail.name,
    cover_image_url: detail.coverImageUrl,
    earliest_release_date: detail.earliestReleaseDate,
    platforms: detail.platforms,
    description: detail.description,
    genres: detail.genres,
    developers: detail.developers,
    publishers: detail.publishers,
    website_url: detail.websiteUrl,
    releases: detail.releases,
    search_updated_at: now,
    detail_updated_at: now,
    updated_at: now,
  };
}

function parsePlatforms(value: unknown): TitlePlatform[] {
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

function parseReleases(value: unknown): PlatformRelease[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    if (
      typeof record.platformId !== "string" ||
      typeof record.platformName !== "string"
    ) {
      return [];
    }

    const releaseDate =
      typeof record.releaseDate === "string" ? record.releaseDate : null;
    const releaseDatePrecision = toReleasePrecision(record.releaseDatePrecision);

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

function toReleasePrecision(value: unknown): ReleaseDatePrecision {
  if (value === "day" || value === "month" || value === "year") {
    return value;
  }
  return "unknown";
}

function areSearchResultsStale(results: LocalSearchResult[]) {
  if (!results.length) return true;

  const cutoff = Date.now() - SEARCH_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
  return results.every((result) => {
    const timestamp = Date.parse(result.searchUpdatedAt);
    return Number.isFinite(timestamp) && timestamp < cutoff;
  });
}

function isDetailStale(row: CachedTitleRow) {
  if (!row.detail_updated_at) return true;
  const timestamp = Date.parse(row.detail_updated_at);
  if (!Number.isFinite(timestamp)) return true;

  const cutoff = Date.now() - DETAIL_FRESHNESS_HOURS * 60 * 60 * 1000;
  return timestamp < cutoff;
}

async function fetchRawgSearchResults(
  query: string,
  limit: number,
  rawgApiKey: string,
): Promise<TitleSummary[]> {
  const searchUrl = new URL(RAWG_BASE_URL);
  searchUrl.searchParams.set("key", rawgApiKey);
  searchUrl.searchParams.set("search", query);
  searchUrl.searchParams.set("page_size", String(limit));

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`RAWG search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as RawgSearchResponse;
  const games = payload.results ?? [];
  return games.map(mapRawgSearchGameToSummary);
}

async function fetchRawgDetail(
  externalId: string,
  rawgApiKey: string,
): Promise<TitleDetails> {
  const detailUrl = new URL(`${RAWG_BASE_URL}/${externalId}`);
  detailUrl.searchParams.set("key", rawgApiKey);

  const response = await fetch(detailUrl);
  if (!response.ok) {
    throw new Error(`RAWG detail failed with status ${response.status}.`);
  }

  const game = (await response.json()) as RawgDetailGame;
  const summary = mapRawgSearchGameToSummary(game);
  const releases = normalizeRawgReleases(game.platforms);

  return {
    ...summary,
    description: game.description_raw ?? null,
    genres: mapNamedList(game.genres),
    developers: mapNamedList(game.developers),
    publishers: mapNamedList(game.publishers),
    websiteUrl: typeof game.website === "string" && game.website.length
      ? game.website
      : null,
    releases,
  };
}

function mapRawgSearchGameToSummary(game: RawgSearchGame): TitleSummary {
  const externalId = String(game.id);
  const slug = game.slug ?? game.name.toLowerCase().replace(/\s+/g, "-");

  return {
    id: `rawg:${externalId}`,
    kind: "game",
    source: "rawg",
    externalId,
    slug,
    name: game.name,
    coverImageUrl: game.background_image,
    earliestReleaseDate: normalizeIsoDate(game.released),
    platforms: normalizeRawgPlatforms(game.platforms),
  };
}

function normalizeRawgPlatforms(
  rawgPlatforms: RawgSearchGame["platforms"],
): TitlePlatform[] {
  if (!rawgPlatforms?.length) {
    return [];
  }

  const deduped = new Map<string, TitlePlatform>();
  for (const item of rawgPlatforms) {
    const platformId = item.platform?.id;
    const platformName = item.platform?.name;
    if (!platformId || !platformName) continue;

    const id = `rawg-platform:${platformId}`;
    deduped.set(id, { id, name: platformName });
  }

  return Array.from(deduped.values());
}

function normalizeRawgReleases(
  rawgPlatforms: RawgDetailGame["platforms"],
): PlatformRelease[] {
  if (!rawgPlatforms?.length) {
    return [];
  }

  const deduped = new Map<string, PlatformRelease>();
  for (const item of rawgPlatforms) {
    const platformId = item.platform?.id;
    const platformName = item.platform?.name;
    if (!platformId || !platformName) continue;

    const id = `rawg-platform:${platformId}`;
    const releaseDate = normalizeIsoDate(item.released_at ?? null);
    deduped.set(id, {
      platformId: id,
      platformName,
      releaseDate,
      releaseDatePrecision: releaseDate ? "day" : "unknown",
    });
  }

  return Array.from(deduped.values());
}

function mapNamedList(list: Array<{ name?: string }> | undefined): string[] {
  if (!list?.length) return [];
  return list
    .map((item) => item.name)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function extractRawgExternalId(titleId: string, row: CachedTitleRow | null) {
  if (row?.source === "rawg") {
    return row.external_id;
  }

  if (!titleId.startsWith("rawg:")) {
    return null;
  }

  return titleId.slice("rawg:".length);
}

function normalizeIsoDate(value: string | null) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function clampLimit(value: string | null) {
  if (!value) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, 25);
}

function jsonResponse(
  payload: TitleSearchResult | TitleDetails | ApiErrorPayload,
  status = 200,
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
