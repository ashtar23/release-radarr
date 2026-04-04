import type { WatchlistSort } from "@repo/types";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const watchlistConfigError = apiClientConfigError;

function listWatchlist({
  signal,
  sort,
  query,
  cursor,
  limit,
}: {
  signal: AbortSignal;
  sort: WatchlistSort;
  query?: string;
  cursor?: string;
  limit?: number;
}) {
  if (!apiClient) {
    throw new Error(watchlistConfigError ?? "Watchlist API is not configured.");
  }

  return apiClient.listWatchlist({ signal, sort, query, cursor, limit });
}

function getWatchlistMembership({
  titleId,
  signal,
}: {
  titleId: string;
  signal?: AbortSignal;
}) {
  if (!apiClient) {
    throw new Error(watchlistConfigError ?? "Watchlist API is not configured.");
  }

  return apiClient.getWatchlistMembership({ titleId, signal });
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

export {
  listWatchlist,
  getWatchlistMembership,
  addWatchlistItem,
  removeWatchlistItem,
};
