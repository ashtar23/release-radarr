import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import {
  getNotificationPreferences,
  notificationsConfigError,
} from "../data-access/notifications";
import { getNotificationPreferencesQueryKey } from "./notifications-query-key";

const NOTIFICATION_PREFERENCES_STALE_TIME = 5 * 60 * 1000;
const NOTIFICATION_PREFERENCES_GC_TIME = 12 * 60 * 60 * 1000;

function useNotificationPreferencesQuery() {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: getNotificationPreferencesQueryKey(userId),
    enabled: Boolean(userId) && notificationsConfigError === null && isReady,
    queryFn: () => getNotificationPreferences(),
    staleTime: NOTIFICATION_PREFERENCES_STALE_TIME,
    gcTime: NOTIFICATION_PREFERENCES_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export { useNotificationPreferencesQuery };
