import type { WatchlistItem } from "@repo/types";

export function normalizeWatchlistSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLocaleLowerCase()
    .trim();
}

export function matchesWatchlistSearchQuery(
  item: WatchlistItem,
  query: string,
) {
  const normalizedQuery = normalizeWatchlistSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  return normalizeWatchlistSearchText(item.title.name).includes(
    normalizedQuery,
  );
}
