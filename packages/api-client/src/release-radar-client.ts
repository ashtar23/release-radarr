import type { NotificationPreferencesResult } from "@repo/types";
import type { NotificationRecordListResult } from "@repo/types";
import type { NotificationUnreadCountResult } from "@repo/types";
import type { MarkNotificationReadResult } from "@repo/types";
import type { HomeDiscoveryResult } from "@repo/types";
import type { HealthStatus } from "@repo/types";
import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { TitleSummary } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";

import { getHomeDiscovery, type GetHomeDiscoveryParams } from "./home";
import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotifications,
  markNotificationRead,
  updateNotificationPreferences,
  type ListNotificationsParams,
  type MarkNotificationReadParams,
  type UpdateNotificationPreferencesParams,
} from "./notifications";
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
  getHomeDiscovery(
    params?: GetHomeDiscoveryParams,
  ): Promise<HomeDiscoveryResult<TitleSummary>>;
  searchTitles(params: SearchTitlesParams): Promise<TitleSearchResult>;
  getTitleDetails(params: GetTitleDetailsParams): Promise<TitleDetails>;
  listNotifications(
    params?: ListNotificationsParams,
  ): Promise<NotificationRecordListResult>;
  getNotificationUnreadCount(): Promise<NotificationUnreadCountResult>;
  markNotificationRead(
    params: MarkNotificationReadParams,
  ): Promise<MarkNotificationReadResult>;
  getNotificationPreferences(): Promise<NotificationPreferencesResult>;
  updateNotificationPreferences(
    params: UpdateNotificationPreferencesParams,
  ): Promise<NotificationPreferencesResult>;
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
    async getHomeDiscovery(params = {}) {
      return getHomeDiscovery({
        context,
        params,
      });
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
    async listNotifications(params = {}) {
      return listNotifications({
        context,
        params,
      });
    },
    async getNotificationUnreadCount() {
      return getNotificationUnreadCount({
        context,
      });
    },
    async markNotificationRead(params) {
      return markNotificationRead({
        context,
        params,
      });
    },
    async getNotificationPreferences() {
      return getNotificationPreferences({
        context,
      });
    },
    async updateNotificationPreferences(params) {
      return updateNotificationPreferences({
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
