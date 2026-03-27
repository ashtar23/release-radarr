export function getWatchlistQueryKey(userId: string | null) {
  return ["watchlist", userId] as const;
}
