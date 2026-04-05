import type { TitleSummary } from "@repo/types";

const RAWG_BASE_URL = "https://api.rawg.io/api/games";

// Transitional provider helper kept for later migration phases. Phase 1 home
// discovery intentionally does not call RAWG on the request path.

type RawgSearchResponse = {
  results?: RawgSearchGame[];
};

type RawgSearchGame = {
  id: number;
  slug: string | null;
  name: string;
  background_image: string | null;
  released: string | null;
  rating?: number | null;
  ratings_count?: number | null;
  metacritic?: number | null;
  added?: number | null;
  reviews_count?: number | null;
  suggestions_count?: number | null;
  rating_top?: number | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
  }>;
};

export async function fetchRawgDiscoveryResults(params: {
  rawgApiKey: string;
  pageSize: number;
  ordering?: string;
  dates?: string;
}): Promise<TitleSummary[]> {
  const url = new URL(RAWG_BASE_URL);
  url.searchParams.set("key", params.rawgApiKey);
  url.searchParams.set("page_size", String(params.pageSize));

  if (params.ordering) {
    url.searchParams.set("ordering", params.ordering);
  }

  if (params.dates) {
    url.searchParams.set("dates", params.dates);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`RAWG discovery failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as RawgSearchResponse;
  return (payload.results ?? []).map(mapRawgSearchGameToSummary);
}

export async function fetchRawgSearchResults(params: {
  rawgApiKey: string;
  query: string;
  page: number;
  pageSize: number;
  precise: boolean;
  exact: boolean;
}): Promise<{
  totalCount: number | null;
  results: TitleSummary[];
}> {
  const searchUrl = new URL(RAWG_BASE_URL);
  searchUrl.searchParams.set("key", params.rawgApiKey);
  searchUrl.searchParams.set("search", params.query);
  searchUrl.searchParams.set("page", String(params.page));
  searchUrl.searchParams.set("page_size", String(params.pageSize));

  if (params.precise) {
    searchUrl.searchParams.set("search_precise", "true");
  }

  if (params.exact) {
    searchUrl.searchParams.set("search_exact", "true");
  }

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`RAWG search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as RawgSearchResponse & {
    count?: number;
  };

  return {
    totalCount:
      typeof payload.count === "number" &&
      Number.isFinite(payload.count) &&
      payload.count >= 0
        ? payload.count
        : null,
    results: (payload.results ?? []).map(mapRawgSearchGameToSummary),
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
    rawgRating: normalizeRawgRating(game.rating),
    rawgRatingsCount: normalizeRawgNonNegativeInt(game.ratings_count),
    rawgMetacritic: normalizeRawgMetacritic(game.metacritic),
    rawgAdded: normalizeRawgNonNegativeInt(game.added),
    rawgReviewsCount: normalizeRawgNonNegativeInt(game.reviews_count),
    rawgSuggestionsCount: normalizeRawgNonNegativeInt(game.suggestions_count),
    rawgRatingTop: normalizeRawgNonNegativeInt(game.rating_top),
  };
}

function normalizeIsoDate(value: string | null) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeRawgPlatforms(
  rawgPlatforms: RawgSearchGame["platforms"],
): TitleSummary["platforms"] {
  if (!rawgPlatforms?.length) {
    return [];
  }

  const deduped = new Map<string, TitleSummary["platforms"][number]>();
  for (const item of rawgPlatforms) {
    const platformId = item.platform?.id;
    const platformName = item.platform?.name;
    if (!platformId || !platformName) continue;

    const id = `rawg-platform:${platformId}`;
    deduped.set(id, { id, name: platformName });
  }

  return Array.from(deduped.values());
}

function normalizeRawgRating(value: unknown): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return clamp(value, 0, 5);
}

function normalizeRawgMetacritic(value: unknown): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return Math.round(clamp(value, 0, 100));
}

function normalizeRawgNonNegativeInt(value: unknown): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  return Math.max(Math.round(value), 0);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
