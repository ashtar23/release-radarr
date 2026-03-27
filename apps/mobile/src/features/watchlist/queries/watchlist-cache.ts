import type { TitleDetails, WatchlistListResult } from "@repo/types";
import type { QueryClient } from "@tanstack/react-query";

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
) {
  const filteredItems = items.filter(
    (existingItem) => existingItem.id !== item.id,
  );
  return [item, ...filteredItems];
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
) {
  return queryClient.getQueryData<WatchlistListResult>(
    getWatchlistQueryKey(userId),
  );
}

export function setWatchlistSnapshot(
  queryClient: QueryClient,
  userId: string | null,
  snapshot: WatchlistListResult,
) {
  queryClient.setQueryData(getWatchlistQueryKey(userId), snapshot);
}
