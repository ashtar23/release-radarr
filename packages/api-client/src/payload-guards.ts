import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { WatchlistItem } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";

export function isTitleSearchResult(value: unknown): value is TitleSearchResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.query === "string" &&
    Array.isArray(value.results) &&
    typeof value.totalCount === "number" &&
    Number.isFinite(value.totalCount) &&
    value.totalCount >= 0 &&
    typeof value.page === "number" &&
    Number.isInteger(value.page) &&
    value.page >= 1 &&
    typeof value.limit === "number" &&
    Number.isInteger(value.limit) &&
    value.limit >= 1 &&
    typeof value.hasMore === "boolean" &&
    value.results.every(isTitleSummary) &&
    (
      value.servedBy === undefined ||
      value.servedBy === "local-cache" ||
      value.servedBy === "rawg-refresh"
    ) &&
    (
      value.decisionReason === undefined ||
      value.decisionReason === "local_sufficient" ||
      value.decisionReason === "sparse_broad_local" ||
      value.decisionReason === "forced_refresh" ||
      value.decisionReason === "provider_missing_key" ||
      value.decisionReason === "provider_fetch_failed" ||
      value.decisionReason === "provider_used"
    )
  );
}

export function isTitleDetails(value: unknown): value is TitleDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.platforms) &&
    Array.isArray(value.releases) &&
    hasValidRawgRichMetadata(value)
  );
}

export function isWatchlistListResult(value: unknown): value is WatchlistListResult {
  if (!isRecord(value)) {
    return false;
  }

  if (!Array.isArray(value.items)) {
    return false;
  }

  return value.items.every(isWatchlistItem);
}

export function isWatchlistUpsertResult(
  value: unknown,
): value is WatchlistUpsertResult {
  if (!isRecord(value)) {
    return false;
  }

  return isWatchlistItem(value.item);
}

function isWatchlistItem(value: unknown): value is WatchlistItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.addedAt === "string" &&
    isTitleSummary(value.title) &&
    Array.isArray(value.releases)
  );
}

function isTitleSummary(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.platforms) &&
    hasValidRawgRichMetadata(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasValidRawgRichMetadata(value: Record<string, unknown>) {
  return (
    isOptionalNullableFiniteNumberField(value, "rawgRating") &&
    isOptionalNullableFiniteNumberField(value, "rawgRatingsCount") &&
    isOptionalNullableFiniteNumberField(value, "rawgMetacritic") &&
    isOptionalNullableFiniteNumberField(value, "rawgAdded") &&
    isOptionalNullableFiniteNumberField(value, "rawgReviewsCount") &&
    isOptionalNullableFiniteNumberField(value, "rawgSuggestionsCount") &&
    isOptionalNullableFiniteNumberField(value, "rawgRatingTop")
  );
}

function isOptionalNullableFiniteNumberField(
  value: Record<string, unknown>,
  key: string,
) {
  if (!(key in value) || value[key] === null) {
    return true;
  }

  return typeof value[key] === "number" && Number.isFinite(value[key]);
}
