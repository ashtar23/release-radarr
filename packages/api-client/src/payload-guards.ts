import type {
  MarkNotificationReadResult,
  NotificationPreferencesResult,
  NotificationRecord,
  NotificationRecordListResult,
  NotificationUnreadCountResult,
} from "@repo/types";
import type { HomeDiscoveryResult } from "@repo/types";
import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { TitleSummary } from "@repo/types";
import type { WatchlistItem } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";
import {
  notificationDestinationKindValues,
  notificationEventTypeValues,
  notificationTimingPresetValues,
  searchDecisionReasonValues,
  searchProviderUsedTriggerValues,
  searchServedByValues,
} from "@repo/types";

const NOTIFICATION_EVENT_TYPE_SET = new Set<string>(notificationEventTypeValues);
const NOTIFICATION_DESTINATION_KIND_SET = new Set<string>(
  notificationDestinationKindValues,
);
const NOTIFICATION_TIMING_PRESET_SET = new Set<string>(
  notificationTimingPresetValues,
);
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

export function isNotificationRecordListResult(
  value: unknown,
): value is NotificationRecordListResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.items) &&
    value.items.every(isNotificationRecord) &&
    (value.nextCursor === null || typeof value.nextCursor === "string")
  );
}

export function isNotificationUnreadCountResult(
  value: unknown,
): value is NotificationUnreadCountResult {
  return (
    isRecord(value) &&
    typeof value.unreadCount === "number" &&
    Number.isInteger(value.unreadCount) &&
    value.unreadCount >= 0
  );
}

export function isMarkNotificationReadResult(
  value: unknown,
): value is MarkNotificationReadResult {
  return isRecord(value) && isNotificationRecord(value.notification);
}

export function isNotificationPreferencesResult(
  value: unknown,
): value is NotificationPreferencesResult {
  if (!isRecord(value) || !isRecord(value.preferences)) {
    return false;
  }

  return isNotificationPreferences(value.preferences);
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

function isNotificationRecord(value: unknown): value is NotificationRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.titleId === "string" &&
    typeof value.eventType === "string" &&
    NOTIFICATION_EVENT_TYPE_SET.has(value.eventType) &&
    typeof value.destinationKind === "string" &&
    NOTIFICATION_DESTINATION_KIND_SET.has(value.destinationKind) &&
    typeof value.destinationTitleId === "string" &&
    typeof value.titleName === "string" &&
    (value.titleArtworkUrl === null ||
      typeof value.titleArtworkUrl === "string") &&
    typeof value.message === "string" &&
    (value.subtitle === null || typeof value.subtitle === "string") &&
    isNotificationPayload(value.eventType, value.payload) &&
    typeof value.createdAt === "string" &&
    (value.readAt === null || typeof value.readAt === "string")
  );
}

function isNotificationPayload(
  eventType: string,
  value: unknown,
): value is NotificationRecord["payload"] {
  if (!isRecord(value)) {
    return false;
  }

  if (eventType === "release_date_changed") {
    return (
      (value.previousReleaseDate === null ||
        typeof value.previousReleaseDate === "string") &&
      (value.nextReleaseDate === null ||
        typeof value.nextReleaseDate === "string")
    );
  }

  if (eventType === "release_approaching") {
    return (
      (value.targetReleaseDate === null ||
        typeof value.targetReleaseDate === "string") &&
      typeof value.timingPreset === "string" &&
      NOTIFICATION_TIMING_PRESET_SET.has(value.timingPreset)
    );
  }

  return false;
}

function isNotificationPreferences(
  value: Record<string, unknown>,
): boolean {
  return (
    isRecord(value.channels) &&
    typeof value.channels.inApp === "boolean" &&
    typeof value.channels.push === "boolean" &&
    isRecord(value.events) &&
    typeof value.events.releaseDateChanged === "boolean" &&
    typeof value.events.releaseApproaching === "boolean" &&
    Array.isArray(value.timingPresets) &&
    value.timingPresets.every(
      (preset) =>
        typeof preset === "string" &&
        NOTIFICATION_TIMING_PRESET_SET.has(preset),
    ) &&
    typeof value.updatedAt === "string"
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
