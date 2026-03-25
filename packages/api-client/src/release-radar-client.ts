import type { HealthStatus } from "@repo/types";
import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";

import { searchTitles, type SearchTitlesParams } from "./search";
import { getTitleDetails, type GetTitleDetailsParams } from "./titles";
import {
  addWatchlistItem,
  listWatchlist,
  removeWatchlistItem,
  type AddWatchlistItemParams,
  type ListWatchlistParams,
  type RemoveWatchlistItemParams,
} from "./watchlist";

export interface ReleaseRadarApiClientOptions {
  readonly baseUrl: string;
  readonly publishableKey: string;
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  readonly onUnauthorized?: () => Promise<boolean> | boolean;
  readonly fetchFn?: typeof fetch;
}

export interface ReleaseRadarApiClient {
  health(): Promise<HealthStatus>;
  searchTitles(params: SearchTitlesParams): Promise<TitleSearchResult>;
  getTitleDetails(params: GetTitleDetailsParams): Promise<TitleDetails>;
  listWatchlist(params?: ListWatchlistParams): Promise<WatchlistListResult>;
  addWatchlistItem(
    params: AddWatchlistItemParams,
  ): Promise<WatchlistUpsertResult>;
  removeWatchlistItem(params: RemoveWatchlistItemParams): Promise<void>;
}

export function createReleaseRadarApiClient(
  options: ReleaseRadarApiClientOptions,
): ReleaseRadarApiClient {
  const context = {
    baseUrl: options.baseUrl,
    publishableKey: options.publishableKey,
    getAccessToken: options.getAccessToken,
    onUnauthorized: options.onUnauthorized,
    fetchFn: options.fetchFn ?? fetch,
  };

  return {
    async health() {
      throw new Error("API endpoints are not scaffolded yet.");
    },
    async searchTitles(params) {
      return searchTitles({
        context,
        params,
      });
    },
    async getTitleDetails(params) {
      return getTitleDetails({
        context,
        params,
      });
    },
    async listWatchlist(params = {}) {
      return listWatchlist({
        context,
        params,
      });
    },
    async addWatchlistItem(params) {
      return addWatchlistItem({
        context,
        params,
      });
    },
    async removeWatchlistItem(params) {
      await removeWatchlistItem({
        context,
        params,
      });
    },
  };
}
