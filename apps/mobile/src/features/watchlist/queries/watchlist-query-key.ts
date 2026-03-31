import type { WatchlistSort } from "@repo/types";

export function getWatchlistQueryScope(userId: string | null) {
  return ["watchlist", userId] as const;
}

export function getWatchlistQueryKey(
  userId: string | null,
  sort: WatchlistSort,
) {
  return [...getWatchlistQueryScope(userId), sort] as const;
}
