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
import {
  openApiGet,
  openApiPost,
  openApiPut,
} from "./openapi-client";
import type { RequestContext } from "./request";

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
  return openApiGet({
    context,
    path: "/notifications",
    query: {
      ...(typeof params?.cursor === "string" && params.cursor.trim()
        ? { cursor: params.cursor.trim() }
        : {}),
      ...(typeof params?.limit === "number" &&
      Number.isInteger(params.limit) &&
      params.limit > 0
        ? { limit: String(params.limit) }
        : {}),
    },
    signal: params?.signal,
    failureMessage: "Notifications request failed.",
  });
}

export function getNotificationUnreadCount({
  context,
  signal,
}: GetNotificationUnreadCountRequestParams): Promise<NotificationUnreadCountResponse> {
  return openApiGet({
    context,
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

  return openApiPost({
    context,
    path: "/notifications/read",
    body: { notificationId },
    signal: params.signal,
    failureMessage: "Mark notification read request failed.",
  });
}

export function markAllNotificationsRead({
  context,
  params,
}: MarkAllNotificationsReadRequestParams): Promise<MarkAllNotificationsReadResponse> {
  return openApiPost({
    context,
    path: "/notifications/read-all",
    signal: params?.signal,
    failureMessage: "Mark all notifications read request failed.",
  });
}

export function getNotificationPreferences({
  context,
  signal,
}: GetNotificationPreferencesRequestParams): Promise<NotificationPreferencesResponse> {
  return openApiGet({
    context,
    path: "/notification-preferences",
    signal,
    failureMessage: "Notification preferences request failed.",
  });
}

export function updateNotificationPreferences({
  context,
  params,
}: UpdateNotificationPreferencesRequestParams): Promise<NotificationPreferencesResponse> {
  return openApiPut({
    context,
    path: "/notification-preferences",
    body: {
      channels: params.channels,
      events: params.events,
      timingPresets: params.timingPresets,
    },
    signal: params.signal,
    failureMessage: "Update notification preferences request failed.",
  });
}
