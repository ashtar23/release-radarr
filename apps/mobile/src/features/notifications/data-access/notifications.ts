import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const notificationsConfigError = apiClientConfigError;

function listNotifications({
  signal,
  cursor,
  limit,
}: {
  signal: AbortSignal;
  cursor?: string;
  limit?: number;
}) {
  if (!apiClient) {
    throw new Error(
      notificationsConfigError ?? "Notifications API is not configured.",
    );
  }

  return apiClient?.listNotifications({ signal, cursor, limit });
}

function getNotificationUnreadCount() {
  if (!apiClient) {
    throw new Error(
      notificationsConfigError ?? "Notifications API is not configured.",
    );
  }

  return apiClient?.getNotificationUnreadCount();
}

function markNotificationRead({
  signal,
  notificationId,
}: {
  signal?: AbortSignal;
  notificationId: string;
}) {
  if (!apiClient) {
    throw new Error(
      notificationsConfigError ?? "Notifications API is not configured.",
    );
  }

  return apiClient?.markNotificationRead({ signal, notificationId });
}

export { listNotifications, getNotificationUnreadCount, markNotificationRead };
