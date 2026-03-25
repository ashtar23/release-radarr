import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const watchlistConfigError = apiClientConfigError;

function listWatchlist(abortSignal: AbortSignal) {
  if (!apiClient) {
    throw new Error(watchlistConfigError ?? "Watchlist API is not configured.");
  }

  return apiClient.listWatchlist({ signal: abortSignal });
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
