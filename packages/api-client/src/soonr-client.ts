import type { NotificationPreferencesResult } from "@repo/types";
import type { NotificationRecordListResult } from "@repo/types";
import type { NotificationUnreadCountResult } from "@repo/types";
import type { MarkAllNotificationsReadResult } from "@repo/types";
import type { MarkNotificationReadResult } from "@repo/types";
import type { HomeDiscoveryResult } from "@repo/types";
import type { HealthStatus } from "@repo/types";
import type { TitleDetailsResult } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { TitleSummary } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistMembershipResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";

import { isHealthStatus } from "./payload-guards";
import { getHomeDiscovery, type GetHomeDiscoveryParams } from "./home";
import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type ListNotificationsParams,
  type MarkAllNotificationsReadParams,
  type MarkNotificationReadParams,
  type UpdateNotificationPreferencesParams,
} from "./notifications";
import { searchTitles, type SearchTitlesParams } from "./search";
import { getTitleDetails, type GetTitleDetailsParams } from "./titles";
import {
  addWatchlistItem,
  getWatchlistMembership,
  listWatchlist,
  removeWatchlistItem,
  type AddWatchlistItemParams,
  type GetWatchlistMembershipParams,
  type ListWatchlistParams,
  type RemoveWatchlistItemParams,
} from "./watchlist";
import { requestJson } from "./request";

export interface SoonrApiClientOptions {
  readonly baseUrl: string;
  readonly publishableKey: string;
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  readonly onUnauthorized?: () => Promise<boolean> | boolean;
  readonly fetchFn?: typeof fetch;
}

export interface SoonrApiClient {
  health(): Promise<HealthStatus>;
  getHomeDiscovery(
    params?: GetHomeDiscoveryParams,
  ): Promise<HomeDiscoveryResult<TitleSummary>>;
  searchTitles(params: SearchTitlesParams): Promise<TitleSearchResult>;
  getTitleDetails(params: GetTitleDetailsParams): Promise<TitleDetailsResult>;
  listNotifications(
    params?: ListNotificationsParams,
  ): Promise<NotificationRecordListResult>;
  getNotificationUnreadCount(): Promise<NotificationUnreadCountResult>;
  markAllNotificationsRead(
    params?: MarkAllNotificationsReadParams,
  ): Promise<MarkAllNotificationsReadResult>;
  markNotificationRead(
    params: MarkNotificationReadParams,
  ): Promise<MarkNotificationReadResult>;
  getNotificationPreferences(): Promise<NotificationPreferencesResult>;
  updateNotificationPreferences(
    params: UpdateNotificationPreferencesParams,
  ): Promise<NotificationPreferencesResult>;
  listWatchlist(params?: ListWatchlistParams): Promise<WatchlistListResult>;
  getWatchlistMembership(
    params: GetWatchlistMembershipParams,
  ): Promise<WatchlistMembershipResult>;
  addWatchlistItem(
    params: AddWatchlistItemParams,
  ): Promise<WatchlistUpsertResult>;
  removeWatchlistItem(params: RemoveWatchlistItemParams): Promise<void>;
}

export function createSoonrApiClient(
  options: SoonrApiClientOptions,
): SoonrApiClient {
  const context = {
    baseUrl: options.baseUrl,
    publishableKey: options.publishableKey,
    getAccessToken: options.getAccessToken,
    onUnauthorized: options.onUnauthorized,
    fetchFn: options.fetchFn ?? fetch,
  };

  return {
    async health() {
      return requestJson({
        context,
        method: "GET",
        path: "/health",
        validate: isHealthStatus,
        invalidPayloadMessage: "Health payload is invalid.",
        failureMessage: "Health request failed.",
      });
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
    async markAllNotificationsRead(params = {}) {
      return markAllNotificationsRead({
        context,
        params,
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
    async getWatchlistMembership(params) {
      return getWatchlistMembership({
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
