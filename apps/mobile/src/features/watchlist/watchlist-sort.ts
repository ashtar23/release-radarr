import type { WatchlistItem, WatchlistSort } from "@repo/types";
import { match } from "ts-pattern";

export const DEFAULT_WATCHLIST_SORT: WatchlistSort = "added-desc";

export type WatchlistSortFamily = "name" | "added" | "release";

export const WATCHLIST_SORT_OPTIONS: readonly {
  value: WatchlistSort;
  label: string;
}[] = [
  { value: "name-asc", label: "Title (A-Z)" },
  { value: "name-desc", label: "Title (Z-A)" },
  { value: "added-desc", label: "Date added (newest first)" },
  { value: "added-asc", label: "Date added (oldest first)" },
  { value: "release-desc", label: "Release date (latest first)" },
  { value: "release-asc", label: "Release date (earliest first)" },
];

export const WATCHLIST_SORT_TOGGLES: readonly {
  family: WatchlistSortFamily;
  label: string;
  defaultValue: WatchlistSort;
}[] = [
  { family: "name", label: "Name", defaultValue: "name-asc" },
  { family: "added", label: "Date added", defaultValue: "added-desc" },
  { family: "release", label: "Release date", defaultValue: "release-desc" },
];

export function getWatchlistSortLabel(sort: WatchlistSort) {
  return (
    WATCHLIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ??
    "Recently added"
  );
}

export function getWatchlistSortFamily(
  sort: WatchlistSort,
): WatchlistSortFamily {
  if (sort.startsWith("name-")) {
    return "name";
  }

  if (sort.startsWith("release-")) {
    return "release";
  }

  return "added";
}

export function isWatchlistSortAscending(sort: WatchlistSort) {
  return sort.endsWith("-asc");
}

export function toggleWatchlistSort(
  currentSort: WatchlistSort,
  family: WatchlistSortFamily,
) {
  if (getWatchlistSortFamily(currentSort) !== family) {
    return (
      WATCHLIST_SORT_TOGGLES.find((option) => option.family === family)
        ?.defaultValue ?? DEFAULT_WATCHLIST_SORT
    );
  }

  return match(currentSort)
    .with("name-asc", () => "name-desc" as const)
    .with("name-desc", () => "name-asc" as const)
    .with("added-asc", () => "added-desc" as const)
    .with("added-desc", () => "added-asc" as const)
    .with("release-asc", () => "release-desc" as const)
    .with("release-desc", () => "release-asc" as const)
    .exhaustive();
}

export function sortWatchlistItems(
  items: WatchlistItem[],
  sort: WatchlistSort,
): WatchlistItem[] {
  return [...items].sort((left, right) =>
    compareWatchlistItems(left, right, sort),
  );
}

function compareWatchlistItems(
  left: WatchlistItem,
  right: WatchlistItem,
  sort: WatchlistSort,
) {
  return match(sort)
    .with("added-asc", () => {
      return (
        compareIsoDateTime(left.addedAt, right.addedAt) ||
        left.id.localeCompare(right.id)
      );
    })
    .with("release-asc", () => {
      return (
        compareNullableIsoDate(
          left.title.earliestReleaseDate,
          right.title.earliestReleaseDate,
          "asc",
        ) || compareIsoDateTime(right.addedAt, left.addedAt)
      );
    })
    .with("release-desc", () => {
      return (
        compareNullableIsoDate(
          left.title.earliestReleaseDate,
          right.title.earliestReleaseDate,
          "desc",
        ) || compareIsoDateTime(right.addedAt, left.addedAt)
      );
    })
    .with("name-asc", () => {
      return (
        compareTitleName(left.title.name, right.title.name, "asc") ||
        compareIsoDateTime(right.addedAt, left.addedAt)
      );
    })
    .with("name-desc", () => {
      return (
        compareTitleName(left.title.name, right.title.name, "desc") ||
        compareIsoDateTime(right.addedAt, left.addedAt)
      );
    })
    .with("added-desc", () => {
      return (
        compareIsoDateTime(right.addedAt, left.addedAt) ||
        left.id.localeCompare(right.id)
      );
    })
    .exhaustive();
}

function compareIsoDateTime(left: string, right: string) {
  return left.localeCompare(right);
}

function compareNullableIsoDate(
  left: string | null,
  right: string | null,
  direction: "asc" | "desc",
) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return direction === "asc"
    ? left.localeCompare(right)
    : right.localeCompare(left);
}

function compareTitleName(
  left: string,
  right: string,
  direction: "asc" | "desc",
) {
  return direction === "asc"
    ? left.localeCompare(right, undefined, { sensitivity: "base" })
    : right.localeCompare(left, undefined, { sensitivity: "base" });
}
