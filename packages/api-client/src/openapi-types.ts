import type { paths } from "./generated/openapi";

export type HomeDiscoveryResponse =
  paths["/home/discovery"]["get"]["responses"][200]["content"]["application/json"];

export type TitleSearchResponse =
  paths["/titles"]["get"]["responses"][200]["content"]["application/json"];

export type TitleDetailsResponse =
  paths["/titles/{titleId}"]["get"]["responses"][200]["content"]["application/json"];

export type NotificationUnreadCountResponse =
  paths["/notifications/unread-count"]["get"]["responses"][200]["content"]["application/json"];

export type NotificationRecordListResponse =
  paths["/notifications"]["get"]["responses"][200]["content"]["application/json"];

export type NotificationPreferencesResponse =
  paths["/notification-preferences"]["get"]["responses"][200]["content"]["application/json"];

export type MarkNotificationReadResponse =
  paths["/notifications/read"]["post"]["responses"][200]["content"]["application/json"];

export type MarkAllNotificationsReadResponse =
  paths["/notifications/read-all"]["post"]["responses"][200]["content"]["application/json"];

export type WatchlistListResponse =
  paths["/watchlist"]["get"]["responses"][200]["content"]["application/json"];

export type WatchlistUpsertResponse =
  paths["/watchlist"]["post"]["responses"][201]["content"]["application/json"];

export type WatchlistMembershipResponse =
  paths["/watchlist/{titleId}"]["get"]["responses"][200]["content"]["application/json"];
