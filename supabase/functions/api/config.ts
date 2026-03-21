export const RAWG_BASE_URL = "https://api.rawg.io/api/games";
export const SEARCH_FRESHNESS_DAYS = 7;
export const DETAIL_FRESHNESS_HOURS = 24;
export const MIN_LOCAL_RESULTS_BEFORE_FALLBACK = 5;
export const DEFAULT_LIMIT = 10;
export const MIN_QUERY_LENGTH = 2;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};
