import type { WatchlistSort } from "@repo/types";

export function getWatchlistListQueryScope(userId: string | null) {
  return ["watchlist", userId, "infinite"] as const;
}

export function getWatchlistListQueryKey(
  userId: string | null,
  sort: WatchlistSort,
) {
  return [...getWatchlistListQueryScope(userId), sort] as const;
}

export function getWatchlistMembershipQueryKey(
  userId: string | null,
  titleId: string,
) {
  return ["watchlist-membership", userId, titleId] as const;
}
