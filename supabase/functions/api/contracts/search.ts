export const SEARCH_SERVED_BY_VALUES = ["local-cache", "rawg-refresh"] as const;
export type SearchServedBy = (typeof SEARCH_SERVED_BY_VALUES)[number];

export const SEARCH_DECISION_REASON_VALUES = [
  "local_sufficient",
  "sparse_broad_local",
  "forced_refresh",
  "provider_missing_key",
  "provider_fetch_failed",
  "provider_used",
] as const;
export type SearchDecisionReason =
  (typeof SEARCH_DECISION_REASON_VALUES)[number];

export const SEARCH_PROVIDER_USED_TRIGGER_VALUES = [
  "coverage",
  "freshness",
  "coverage_and_freshness",
] as const;
export type SearchProviderUsedTrigger =
  (typeof SEARCH_PROVIDER_USED_TRIGGER_VALUES)[number];

export const SEARCH_INTENT_MODE_VALUES = ["broad", "specific"] as const;
export type QueryIntentMode = (typeof SEARCH_INTENT_MODE_VALUES)[number];
