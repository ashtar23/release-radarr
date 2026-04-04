import { useMemo, useState } from "react";
import type { WatchlistItem } from "@repo/types";

const EMPTY_FILTERED_ITEMS: WatchlistItem[] = [];

export function useWatchlistSearch(items: WatchlistItem[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = normalizeWatchlistSearchText(searchQuery);

  const filteredItems = useMemo(() => {
    if (!normalizedSearchQuery) {
      return items;
    }

    return items.filter((item) =>
      normalizeWatchlistSearchText(item.title.name).includes(
        normalizedSearchQuery,
      ),
    );
  }, [items, normalizedSearchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    trimmedSearchQuery: searchQuery.trim(),
    filteredItems:
      filteredItems.length > 0 || items.length > 0
        ? filteredItems
        : EMPTY_FILTERED_ITEMS,
  };
}

function normalizeWatchlistSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLocaleLowerCase()
    .trim();
}
