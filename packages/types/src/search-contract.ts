export const searchServedByValues = ["local-cache", "rawg-refresh"] as const;
export type SearchServedBy = (typeof searchServedByValues)[number];

export const searchDecisionReasonValues = [
  "local_sufficient",
  "sparse_broad_local",
  "forced_refresh",
  "provider_missing_key",
  "provider_fetch_failed",
  "provider_used",
] as const;
export type SearchDecisionReason = (typeof searchDecisionReasonValues)[number];

export const searchProviderUsedTriggerValues = [
  "coverage",
  "freshness",
  "coverage_and_freshness",
] as const;
export type SearchProviderUsedTrigger =
  (typeof searchProviderUsedTriggerValues)[number];

export const searchIntentModeValues = ["broad", "specific"] as const;
export type SearchIntentMode = (typeof searchIntentModeValues)[number];
