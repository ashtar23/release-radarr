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

function getNotificationPreferences() {
  if (!apiClient) {
    throw new Error(
      notificationsConfigError ?? "Notifications API is not configured.",
    );
  }

  return apiClient?.getNotificationPreferences();
}

function updateNotificationPreferences({
  signal,
  channels,
  events,
  timingPresets,
}: {
  signal?: AbortSignal;
  channels: {
    inApp: boolean;
    push: boolean;
  };
  events: {
    releaseDateChanged: boolean;
    releaseApproaching: boolean;
  };
  timingPresets: (
    | "on_day"
    | "hours_24_before"
    | "days_7_before"
    | "days_30_before"
  )[];
}) {
  if (!apiClient) {
    throw new Error(
      notificationsConfigError ?? "Notifications API is not configured.",
    );
  }

  return apiClient?.updateNotificationPreferences({
    signal,
    channels,
    events,
    timingPresets,
  });
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
  getNotificationPreferences,
  listNotifications,
  getNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
};
