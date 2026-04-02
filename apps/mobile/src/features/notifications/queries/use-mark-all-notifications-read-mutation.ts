import type {
  NotificationRecordListResult,
  NotificationUnreadCountResult,
} from "@repo/types";
import { useAuth } from "@/auth/auth-provider";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  markAllNotificationsRead,
  notificationsConfigError,
} from "../data-access/notifications";
import {
  getNotificationUnreadCountQueryKey,
  getNotificationsQueryScope,
} from "./notifications-query-key";

function useMarkAllNotificationsReadMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const invalidateNotifications = () => {
    if (!userId) {
      return;
    }

    queryClient
      .invalidateQueries({ queryKey: getNotificationsQueryScope(userId) })
      .catch(() => {});
    queryClient
      .invalidateQueries({
        queryKey: getNotificationUnreadCountQueryKey(userId),
      })
      .catch(() => {});
  };

  return useMutation({
    mutationFn: async () => {
      if (notificationsConfigError) {
        throw new Error(notificationsConfigError);
      }

      return markAllNotificationsRead();
    },
    onMutate: async () => {
      if (!userId) {
        return;
      }

      const notificationsQueryScope = getNotificationsQueryScope(userId);
      const unreadCountQueryKey = getNotificationUnreadCountQueryKey(userId);
      const readAt = new Date().toISOString();

      await queryClient.cancelQueries({ queryKey: notificationsQueryScope });
      await queryClient.cancelQueries({ queryKey: unreadCountQueryKey });

      queryClient.setQueriesData<InfiniteData<NotificationRecordListResult>>(
        { queryKey: notificationsQueryScope },
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.readAt == null ? { ...item, readAt } : item,
              ),
            })),
          };
        },
      );

      queryClient.setQueryData<NotificationUnreadCountResult>(
        unreadCountQueryKey,
        () => ({ unreadCount: 0 }),
      );
    },
    onSettled: invalidateNotifications,
  });
}

export { useMarkAllNotificationsReadMutation };
