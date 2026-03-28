import type { HomeDiscoveryResult } from "@repo/types";
import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { TitleSummary } from "@repo/types";
import type { WatchlistItem } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";
import {
  searchDecisionReasonValues,
  searchProviderUsedTriggerValues,
  searchServedByValues,
} from "@repo/types";

const SEARCH_SERVED_BY_SET = new Set<string>(searchServedByValues);
const SEARCH_DECISION_REASON_SET = new Set<string>(searchDecisionReasonValues);
const SEARCH_PROVIDER_USED_TRIGGER_SET = new Set<string>(
  searchProviderUsedTriggerValues,
);

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
      (typeof value.servedBy === "string" &&
        SEARCH_SERVED_BY_SET.has(value.servedBy))
    ) &&
    (
      value.decisionReason === undefined ||
      (typeof value.decisionReason === "string" &&
        SEARCH_DECISION_REASON_SET.has(value.decisionReason))
    ) &&
    (
      value.providerUsedTrigger === undefined ||
      (typeof value.providerUsedTrigger === "string" &&
        SEARCH_PROVIDER_USED_TRIGGER_SET.has(value.providerUsedTrigger))
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

export function isHomeDiscoveryResult(
  value: unknown,
): value is HomeDiscoveryResult<TitleSummary> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.upcoming) &&
    Array.isArray(value.latest) &&
    Array.isArray(value.popular) &&
    value.upcoming.every(isTitleSummary) &&
    value.latest.every(isTitleSummary) &&
    value.popular.every(isTitleSummary)
  );
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

function isTitleSummary(value: unknown): value is TitleSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.kind === "string" &&
    typeof value.source === "string" &&
    typeof value.externalId === "string" &&
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    (value.coverImageUrl === null || typeof value.coverImageUrl === "string") &&
    (value.earliestReleaseDate === null ||
      typeof value.earliestReleaseDate === "string") &&
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
