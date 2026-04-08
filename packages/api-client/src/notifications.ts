import type {
  ListNotificationsInput,
  MarkNotificationReadInput,
  UpdateNotificationPreferencesInput,
} from "@repo/types";

import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationPreferencesResponse,
  NotificationRecordListResponse,
  NotificationUnreadCountResponse,
} from "./openapi-types";
import { requestJson, type RequestContext } from "./request";

export interface ListNotificationsParams extends ListNotificationsInput {
  readonly signal?: AbortSignal;
}

export interface MarkNotificationReadParams extends MarkNotificationReadInput {
  readonly signal?: AbortSignal;
}

export interface MarkAllNotificationsReadParams {
  readonly signal?: AbortSignal;
}

export interface UpdateNotificationPreferencesParams extends UpdateNotificationPreferencesInput {
  readonly signal?: AbortSignal;
}

interface ListNotificationsRequestParams {
  readonly context: RequestContext;
  readonly params?: ListNotificationsParams;
}

interface MarkNotificationReadRequestParams {
  readonly context: RequestContext;
  readonly params: MarkNotificationReadParams;
}

interface MarkAllNotificationsReadRequestParams {
  readonly context: RequestContext;
  readonly params?: MarkAllNotificationsReadParams;
}

interface UpdateNotificationPreferencesRequestParams {
  readonly context: RequestContext;
  readonly params: UpdateNotificationPreferencesParams;
}

interface GetNotificationPreferencesRequestParams {
  readonly context: RequestContext;
  readonly signal?: AbortSignal;
}

interface GetNotificationUnreadCountRequestParams {
  readonly context: RequestContext;
  readonly signal?: AbortSignal;
}

export function listNotifications({
  context,
  params,
}: ListNotificationsRequestParams): Promise<NotificationRecordListResponse> {
  const searchParams = new URLSearchParams();
  if (typeof params?.cursor === "string" && params.cursor.trim()) {
    searchParams.set("cursor", params.cursor.trim());
  }

  if (
    typeof params?.limit === "number" &&
    Number.isInteger(params.limit) &&
    params.limit > 0
  ) {
    searchParams.set("limit", String(params.limit));
  }

  const queryString = searchParams.toString();
  const query = queryString ? `?${queryString}` : "";

  return requestJson<NotificationRecordListResponse>({
    context,
    method: "GET",
    path: `/notifications${query}`,
    signal: params?.signal,
    failureMessage: "Notifications request failed.",
  });
}

export function getNotificationUnreadCount({
  context,
  signal,
}: GetNotificationUnreadCountRequestParams): Promise<NotificationUnreadCountResponse> {
  return requestJson<NotificationUnreadCountResponse>({
    context,
    method: "GET",
    path: "/notifications/unread-count",
    signal,
    failureMessage: "Notification unread count request failed.",
  });
}

export function markNotificationRead({
  context,
  params,
}: MarkNotificationReadRequestParams): Promise<MarkNotificationReadResponse> {
  const notificationId = params.notificationId.trim();
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  return requestJson<MarkNotificationReadResponse>({
    context,
    method: "POST",
    path: "/notifications/read",
    signal: params.signal,
    body: JSON.stringify({ notificationId }),
    failureMessage: "Mark notification read request failed.",
  });
}

export function markAllNotificationsRead({
  context,
  params,
}: MarkAllNotificationsReadRequestParams): Promise<MarkAllNotificationsReadResponse> {
  return requestJson<MarkAllNotificationsReadResponse>({
    context,
    method: "POST",
    path: "/notifications/read-all",
    signal: params?.signal,
    failureMessage: "Mark all notifications read request failed.",
  });
}

export function getNotificationPreferences({
  context,
  signal,
}: GetNotificationPreferencesRequestParams): Promise<NotificationPreferencesResponse> {
  return requestJson<NotificationPreferencesResponse>({
    context,
    method: "GET",
    path: "/notification-preferences",
    signal,
    failureMessage: "Notification preferences request failed.",
  });
}

export function updateNotificationPreferences({
  context,
  params,
}: UpdateNotificationPreferencesRequestParams): Promise<NotificationPreferencesResponse> {
  return requestJson<NotificationPreferencesResponse>({
    context,
    method: "PUT",
    path: "/notification-preferences",
    signal: params.signal,
    body: JSON.stringify({
      channels: params.channels,
      events: params.events,
      timingPresets: params.timingPresets,
    }),
    failureMessage: "Update notification preferences request failed.",
  });
}
