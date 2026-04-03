import { useAuth } from "@/auth/auth-provider";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  listNotifications,
  notificationsConfigError,
} from "../data-access/notifications";
import { getNotificationsQueryKey } from "./notifications-query-key";

const NOTIFICATIONS_STALE_TIME = 1000 * 60;
const NOTIFICATIONS_PAGE_SIZE = 20;

function useNotificationsQuery() {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useInfiniteQuery({
    queryKey: getNotificationsQueryKey(userId),
    enabled: Boolean(userId) && notificationsConfigError === null && isReady,
    initialPageParam: null as string | null,
    staleTime: NOTIFICATIONS_STALE_TIME,
    queryFn: ({ pageParam, signal }) =>
      listNotifications({
        signal,
        cursor: typeof pageParam === "string" ? pageParam : undefined,
        limit: NOTIFICATIONS_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export { NOTIFICATIONS_PAGE_SIZE, useNotificationsQuery };
