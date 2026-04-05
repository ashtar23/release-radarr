import { API_PATH_PREFIX } from "@repo/config";
import type {
  ListNotificationsInput,
  MarkAllNotificationsReadResult,
  MarkNotificationReadInput,
  MarkNotificationReadResult,
  NotificationPreferencesResult,
  NotificationRecordListResult,
  NotificationUnreadCountResult,
  UpdateNotificationPreferencesInput,
} from "@repo/types";

import {
  isMarkAllNotificationsReadResult,
  isMarkNotificationReadResult,
  isNotificationPreferencesResult,
  isNotificationRecordListResult,
  isNotificationUnreadCountResult,
} from "./payload-guards";
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
}: ListNotificationsRequestParams): Promise<NotificationRecordListResult> {
  const notificationsBaseUrl = context.notificationsBaseUrl;
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
  const requestPath =
    notificationsBaseUrl == null
      ? `${API_PATH_PREFIX}/notifications${query}`
      : `/notifications${query}`;

  return requestJson({
    context,
    baseUrl: notificationsBaseUrl,
    method: "GET",
    path: requestPath,
    signal: params?.signal,
    validate: isNotificationRecordListResult,
    invalidPayloadMessage: "Notifications payload is invalid.",
    failureMessage: "Notifications request failed.",
  });
}

export function getNotificationUnreadCount({
  context,
  signal,
}: GetNotificationUnreadCountRequestParams): Promise<NotificationUnreadCountResult> {
  const notificationsBaseUrl = context.notificationsBaseUrl;

  return requestJson({
    context,
    baseUrl: notificationsBaseUrl,
    method: "GET",
    path:
      notificationsBaseUrl == null
        ? `${API_PATH_PREFIX}/notifications/unread-count`
        : "/notifications/unread-count",
    signal,
    validate: isNotificationUnreadCountResult,
    invalidPayloadMessage: "Notification unread count payload is invalid.",
    failureMessage: "Notification unread count request failed.",
  });
}

export function markNotificationRead({
  context,
  params,
}: MarkNotificationReadRequestParams): Promise<MarkNotificationReadResult> {
  const notificationId = params.notificationId.trim();
  if (!notificationId) {
    throw new Error("notificationId is required.");
  }

  return requestJson({
    context,
    method: "POST",
    path: `${API_PATH_PREFIX}/notifications/${encodeURIComponent(notificationId)}/read`,
    signal: params.signal,
    validate: isMarkNotificationReadResult,
    invalidPayloadMessage: "Notification read payload is invalid.",
    failureMessage: "Mark notification read request failed.",
  });
}

export function markAllNotificationsRead({
  context,
  params,
}: MarkAllNotificationsReadRequestParams): Promise<MarkAllNotificationsReadResult> {
  return requestJson({
    context,
    method: "POST",
    path: `${API_PATH_PREFIX}/notifications/read-all`,
    signal: params?.signal,
    validate: isMarkAllNotificationsReadResult,
    invalidPayloadMessage: "Mark all notifications read payload is invalid.",
    failureMessage: "Mark all notifications read request failed.",
  });
}

export function getNotificationPreferences({
  context,
  signal,
}: GetNotificationPreferencesRequestParams): Promise<NotificationPreferencesResult> {
  return requestJson({
    context,
    method: "GET",
    path: `${API_PATH_PREFIX}/notification-preferences`,
    signal,
    validate: isNotificationPreferencesResult,
    invalidPayloadMessage: "Notification preferences payload is invalid.",
    failureMessage: "Notification preferences request failed.",
  });
}

export function updateNotificationPreferences({
  context,
  params,
}: UpdateNotificationPreferencesRequestParams): Promise<NotificationPreferencesResult> {
  return requestJson({
    context,
    method: "PUT",
    path: `${API_PATH_PREFIX}/notification-preferences`,
    signal: params.signal,
    body: JSON.stringify({
      channels: params.channels,
      events: params.events,
      timingPresets: params.timingPresets,
    }),
    validate: isNotificationPreferencesResult,
    invalidPayloadMessage:
      "Notification preferences update payload is invalid.",
    failureMessage: "Update notification preferences request failed.",
  });
}
