import type { TitleDetails, WatchlistListResult, WatchlistSort } from "@repo/types";
import type { QueryClient } from "@tanstack/react-query";

import { sortWatchlistItems } from "../watchlist-sort";
import { getWatchlistQueryKey } from "./watchlist-query-key";

type WatchlistItems = WatchlistListResult["items"];

export function buildOptimisticWatchlistItem(
  userId: string,
  title: TitleDetails,
) {
  return {
    id: `${userId}:${title.id}`,
    title,
    releases: title.releases,
    addedAt: new Date().toISOString(),
  };
}

export function upsertWatchlistItem(
  items: WatchlistItems,
  item: WatchlistItems[number],
  sort: WatchlistSort,
) {
  const filteredItems = items.filter(
    (existingItem) => existingItem.id !== item.id,
  );
  return sortWatchlistItems([item, ...filteredItems], sort);
}

export function removeWatchlistItemByTitleId(
  items: WatchlistItems,
  titleId: string,
) {
  return items.filter((item) => item.title.id !== titleId);
}

export function getWatchlistSnapshot(
  queryClient: QueryClient,
  userId: string | null,
  sort: WatchlistSort,
) {
  return queryClient.getQueryData<WatchlistListResult>(
    getWatchlistQueryKey(userId, sort),
  );
}

export function setWatchlistSnapshot(
  queryClient: QueryClient,
  userId: string | null,
  sort: WatchlistSort,
  snapshot: WatchlistListResult,
) {
  queryClient.setQueryData(getWatchlistQueryKey(userId, sort), snapshot);
}
