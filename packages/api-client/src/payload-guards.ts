import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { WatchlistItem } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";

export function isTitleSearchResult(value: unknown): value is TitleSearchResult {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.query === "string" && Array.isArray(value.results);
}

export function isTitleDetails(value: unknown): value is TitleDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.platforms) &&
    Array.isArray(value.releases)
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
    Array.isArray(value.platforms)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
