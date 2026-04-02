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

function markAllNotificationsRead({ signal }: { signal?: AbortSignal } = {}) {
  if (!apiClient) {
    throw new Error(
      notificationsConfigError ?? "Notifications API is not configured.",
    );
  }

  return apiClient?.markAllNotificationsRead({ signal });
}

export {
  listNotifications,
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
};
