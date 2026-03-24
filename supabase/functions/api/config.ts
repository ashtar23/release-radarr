export const RAWG_BASE_URL = "https://api.rawg.io/api/games";
export const SEARCH_FRESHNESS_DAYS = 7;
export const DETAIL_FRESHNESS_HOURS = 24;
export const MIN_LOCAL_RESULTS_BEFORE_FALLBACK = 5;
export const MIN_LOCAL_PAGE_COVERAGE = 0.8;
export const MAX_STALE_RATIO = 0.3;
export const DEFAULT_LIMIT = 20;
export const MIN_QUERY_LENGTH = 2;
export const SEARCH_RANKING_V2_ENABLED_BY_DEFAULT = true;
export const SEARCH_BROAD_DENOISE_ENABLED_BY_DEFAULT = true;

export function isSearchRankingV2Enabled() {
  const rawValue = readOptionalEnv("SEARCH_RANKING_V2");
  if (!rawValue) {
    return SEARCH_RANKING_V2_ENABLED_BY_DEFAULT;
  }

  const normalized = rawValue.trim().toLowerCase();
  return !(normalized === "0" || normalized === "false" || normalized === "off");
}

export function isSearchRankingDebugEnabled() {
  const rawValue = readOptionalEnv("SEARCH_RANKING_DEBUG");
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

export function isSearchBroadDenoiseEnabled() {
  const rawValue = readOptionalEnv("SEARCH_BROAD_DENOISE");
  if (!rawValue) {
    return SEARCH_BROAD_DENOISE_ENABLED_BY_DEFAULT;
  }

  const normalized = rawValue.trim().toLowerCase();
  return !(normalized === "0" || normalized === "false" || normalized === "off");
}

function readOptionalEnv(key: string): string | null {
  try {
    return Deno.env.get(key) ?? null;
  } catch {
    return null;
  }
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};
