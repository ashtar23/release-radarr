export function getNotificationsQueryScope(userId: string | null) {
  return ["notifications", userId] as const;
}

export function getNotificationsQueryKey(
  userId: string | null,
  cursor?: string,
) {
  return [...getNotificationsQueryScope(userId), cursor ?? null] as const;
}

export function getNotificationUnreadCountQueryKey(userId: string | null) {
  return ["notifications-unread-count", userId] as const;
}

export function getNotificationPreferencesQueryKey(userId: string | null) {
  return ["notification-preferences", userId] as const;
}
