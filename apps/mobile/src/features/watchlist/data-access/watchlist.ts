import type { WatchlistSort } from "@repo/types";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const watchlistConfigError = apiClientConfigError;

function listWatchlist({
  signal,
  sort,
}: {
  signal: AbortSignal;
  sort: WatchlistSort;
}) {
  if (!apiClient) {
    throw new Error(watchlistConfigError ?? "Watchlist API is not configured.");
  }

  return apiClient.listWatchlist({ signal, sort });
}

function addWatchlistItem({
  titleId,
  signal,
}: {
  titleId: string;
  signal?: AbortSignal;
}) {
  if (!apiClient) {
    throw new Error(watchlistConfigError ?? "Watchlist API is not configured.");
  }

  return apiClient.addWatchlistItem({ titleId, signal });
}

function removeWatchlistItem({
  titleId,
  signal,
}: {
  titleId: string;
  signal?: AbortSignal;
}) {
  if (!apiClient) {
    throw new Error(watchlistConfigError ?? "Watchlist API is not configured.");
  }

  return apiClient.removeWatchlistItem({ titleId, signal });
}

export { listWatchlist, addWatchlistItem, removeWatchlistItem };
