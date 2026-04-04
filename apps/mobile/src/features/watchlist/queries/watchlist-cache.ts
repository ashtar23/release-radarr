import type {
  TitleDetails,
  WatchlistItem,
  WatchlistListResult,
  WatchlistSort,
} from "@repo/types";
import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";

import { sortWatchlistItems } from "../watchlist-sort";
import {
  getWatchlistListQueryScope,
  getWatchlistMembershipQueryKey,
} from "./watchlist-query-key";

export type WatchlistInfiniteData = InfiniteData<WatchlistListResult>;

export function buildOptimisticWatchlistItem(
  userId: string,
  title: TitleDetails,
): WatchlistItem {
  return {
    id: `${userId}:${title.id}`,
    title,
    releases: title.releases,
    addedAt: new Date().toISOString(),
  };
}

export function updateWatchlistListQueries(
  queryClient: QueryClient,
  userId: string,
  updater: (params: {
    queryKey: QueryKey;
    sort: WatchlistSort;
    current: WatchlistInfiniteData;
  }) => WatchlistInfiniteData,
) {
  const entries = queryClient.getQueriesData<WatchlistInfiniteData>({
    queryKey: getWatchlistListQueryScope(userId),
  });

  for (const [queryKey, current] of entries) {
    const sort = parseSortFromQueryKey(queryKey);
    if (!current || !sort) {
      continue;
    }

    queryClient.setQueryData<WatchlistInfiniteData>(
      queryKey,
      updater({ queryKey, sort, current }),
    );
  }
}

export function snapshotWatchlistListQueries(
  queryClient: QueryClient,
  userId: string,
) {
  return queryClient.getQueriesData<WatchlistInfiniteData>({
    queryKey: getWatchlistListQueryScope(userId),
  });
}

export function restoreWatchlistListQueries(
  queryClient: QueryClient,
  snapshots: readonly (readonly [
    QueryKey,
    WatchlistInfiniteData | undefined,
  ])[],
) {
  for (const [queryKey, snapshot] of snapshots) {
    queryClient.setQueryData(queryKey, snapshot);
  }
}

export function setWatchlistMembershipSnapshot(
  queryClient: QueryClient,
  userId: string,
  titleId: string,
  isInWatchlist: boolean,
) {
  queryClient.setQueryData(getWatchlistMembershipQueryKey(userId, titleId), {
    isInWatchlist,
  });
}

export function getWatchlistMembershipSnapshot(
  queryClient: QueryClient,
  userId: string,
  titleId: string,
) {
  return queryClient.getQueryData<{ isInWatchlist: boolean }>(
    getWatchlistMembershipQueryKey(userId, titleId),
  );
}

export function upsertWatchlistItemInInfiniteData(
  current: WatchlistInfiniteData,
  item: WatchlistItem,
  sort: WatchlistSort,
) {
  const flattenedItems = current.pages.flatMap((page) => page.items);
  const filteredItems = flattenedItems.filter(
    (existingItem) => existingItem.id !== item.id,
  );
  const nextItems = sortWatchlistItems([item, ...filteredItems], sort);

  return replaceInfiniteItems(current, nextItems);
}

export function removeWatchlistItemFromInfiniteData(
  current: WatchlistInfiniteData,
  titleId: string,
) {
  const nextItems = current.pages
    .flatMap((page) => page.items)
    .filter((item) => item.title.id !== titleId);

  return replaceInfiniteItems(current, nextItems);
}

function replaceInfiniteItems(
  current: WatchlistInfiniteData,
  nextItems: WatchlistItem[],
): WatchlistInfiniteData {
  let startIndex = 0;

  return {
    ...current,
    pages: current.pages.map((page) => {
      const pageSize = page.items.length;
      const items = nextItems.slice(startIndex, startIndex + pageSize);
      startIndex += pageSize;

      return {
        ...page,
        items,
      };
    }),
  };
}

function parseSortFromQueryKey(queryKey: QueryKey): WatchlistSort | null {
  const maybeSort = queryKey.at(-1);
  switch (maybeSort) {
    case "added-desc":
    case "added-asc":
    case "release-desc":
    case "release-asc":
    case "name-asc":
    case "name-desc":
      return maybeSort;
    default:
      return null;
  }
}
