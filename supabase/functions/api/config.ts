export const RAWG_BASE_URL = "https://api.rawg.io/api/games";
export const RAWG_SEARCH_TIMEOUT_MS = 2500;
export const SEARCH_FRESHNESS_DAYS = 7;
export const DETAIL_FRESHNESS_HOURS = 24;
export const MIN_LOCAL_RESULTS_BEFORE_FALLBACK = 5;
export const MIN_LOCAL_PAGE_COVERAGE = 0.8;
export const MIN_LOCAL_PAGE_COVERAGE_BROAD_PAGE_ONE = 0.25;
export const MAX_STALE_RATIO = 0.3;
export const DEFAULT_LIMIT = 20;
export const MIN_QUERY_LENGTH = 2;
export const SEARCH_RANKING_V2_ENABLED_BY_DEFAULT = true;
export const SEARCH_BROAD_DENOISE_ENABLED_BY_DEFAULT = true;
export const SEARCH_ADJACENT_SWAP_VARIANTS_ENABLED_BY_DEFAULT = true;
export const SEARCH_ADJACENT_SWAP_VARIANTS_MIN_TOKEN_LENGTH = 6;
export const SEARCH_ADJACENT_SWAP_VARIANTS_MAX_TOKEN_LENGTH = 12;
export const SEARCH_ADJACENT_SWAP_VARIANTS_MAX_VARIANTS = 6;

export function isSearchRankingV2Enabled() {
  const rawValue = readOptionalEnv("SEARCH_RANKING_V2");
  if (!rawValue) {
    return SEARCH_RANKING_V2_ENABLED_BY_DEFAULT;
  }

  const normalized = rawValue.trim().toLowerCase();
  return !(
    normalized === "0" ||
    normalized === "false" ||
    normalized === "off"
  );
}

export function isSearchRankingDebugEnabled() {
  const rawValue = readOptionalEnv("SEARCH_RANKING_DEBUG");
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

export function isSearchTimingDebugEnabled() {
  const rawValue = readOptionalEnv("SEARCH_TIMING_DEBUG");
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

export function getRawgSearchTimeoutMs() {
  return readNonNegativeIntegerEnv(
    "RAWG_SEARCH_TIMEOUT_MS",
    RAWG_SEARCH_TIMEOUT_MS,
  );
}

export type SearchLocalCountMode = "exact" | "planned";

export function getSearchLocalCountMode(page: number): SearchLocalCountMode {
  if (page !== 1) {
    return "exact";
  }

  const rawValue = readOptionalEnv("SEARCH_LOCAL_COUNT_MODE");
  if (!rawValue) {
    return "exact";
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "planned") {
    return "planned";
  }

  return "exact";
}

export function getSearchMinLocalResultsBeforeFallback() {
  return readPositiveIntegerEnv(
    "SEARCH_MIN_LOCAL_RESULTS_BEFORE_FALLBACK",
    MIN_LOCAL_RESULTS_BEFORE_FALLBACK,
  );
}

export function getSearchMinLocalPageCoverage() {
  return readRatioEnv(
    "SEARCH_MIN_LOCAL_PAGE_COVERAGE",
    MIN_LOCAL_PAGE_COVERAGE,
  );
}

export function getSearchMinLocalPageCoverageBroadPageOne() {
  return readRatioEnv(
    "SEARCH_MIN_LOCAL_PAGE_COVERAGE_BROAD_PAGE_ONE",
    MIN_LOCAL_PAGE_COVERAGE_BROAD_PAGE_ONE,
  );
}

export function getSearchMaxStaleRatio() {
  return readRatioEnv("SEARCH_MAX_STALE_RATIO", MAX_STALE_RATIO);
}

export function isSearchAdjacentSwapVariantsEnabled() {
  const rawValue = readOptionalEnv("SEARCH_ADJACENT_SWAP_VARIANTS");
  if (!rawValue) {
    return SEARCH_ADJACENT_SWAP_VARIANTS_ENABLED_BY_DEFAULT;
  }

  const normalized = rawValue.trim().toLowerCase();
  return !(
    normalized === "0" ||
    normalized === "false" ||
    normalized === "off"
  );
}

export function getSearchAdjacentSwapVariantsMinTokenLength() {
  return readPositiveIntegerEnv(
    "SEARCH_ADJACENT_SWAP_VARIANTS_MIN_TOKEN_LENGTH",
    SEARCH_ADJACENT_SWAP_VARIANTS_MIN_TOKEN_LENGTH,
  );
}

export function getSearchAdjacentSwapVariantsMaxTokenLength() {
  return readPositiveIntegerEnv(
    "SEARCH_ADJACENT_SWAP_VARIANTS_MAX_TOKEN_LENGTH",
    SEARCH_ADJACENT_SWAP_VARIANTS_MAX_TOKEN_LENGTH,
  );
}

export function getSearchAdjacentSwapVariantsMaxVariants() {
  return readPositiveIntegerEnv(
    "SEARCH_ADJACENT_SWAP_VARIANTS_MAX_VARIANTS",
    SEARCH_ADJACENT_SWAP_VARIANTS_MAX_VARIANTS,
  );
}

export function isSearchBroadDenoiseEnabled() {
  const rawValue = readOptionalEnv("SEARCH_BROAD_DENOISE");
  if (!rawValue) {
    return SEARCH_BROAD_DENOISE_ENABLED_BY_DEFAULT;
  }

  const normalized = rawValue.trim().toLowerCase();
  return !(
    normalized === "0" ||
    normalized === "false" ||
    normalized === "off"
  );
}

function readOptionalEnv(key: string): string | null {
  try {
    return Deno.env.get(key) ?? null;
  } catch {
    return null;
  }
}

function readPositiveIntegerEnv(key: string, fallback: number) {
  const rawValue = readOptionalEnv(key);
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function readNonNegativeIntegerEnv(key: string, fallback: number) {
  const rawValue = readOptionalEnv(key);
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0) {
    return fallback;
  }

  return value;
}

function readRatioEnv(key: string, fallback: number) {
  const rawValue = readOptionalEnv(key);
  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, 0), 1);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};
