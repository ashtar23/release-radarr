import { useAuth } from "@/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";

import {
  getNotificationUnreadCount,
  notificationsConfigError,
} from "../data-access/notifications";
import { getNotificationUnreadCountQueryKey } from "./notifications-query-key";

const NOTIFICATION_UNREAD_COUNT_STALE_TIME = 1000 * 30;

function useNotificationUnreadCountQuery() {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: getNotificationUnreadCountQueryKey(userId),
    enabled: Boolean(userId) && notificationsConfigError === null && isReady,
    staleTime: NOTIFICATION_UNREAD_COUNT_STALE_TIME,
    queryFn: () => getNotificationUnreadCount(),
  });
}

export { useNotificationUnreadCountQuery };
