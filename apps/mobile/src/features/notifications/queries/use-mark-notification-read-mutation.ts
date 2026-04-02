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
  markNotificationRead,
  notificationsConfigError,
} from "../data-access/notifications";
import {
  getNotificationUnreadCountQueryKey,
  getNotificationsQueryScope,
} from "./notifications-query-key";

type MarkNotificationReadVariables = {
  notificationId: string;
};

function useMarkNotificationReadMutation() {
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
    mutationFn: async ({ notificationId }: MarkNotificationReadVariables) => {
      if (notificationsConfigError) {
        throw new Error(notificationsConfigError);
      }

      return markNotificationRead({ notificationId });
    },
    onMutate: async ({ notificationId }) => {
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
                item.id === notificationId && item.readAt == null
                  ? { ...item, readAt }
                  : item,
              ),
            })),
          };
        },
      );

      queryClient.setQueryData<NotificationUnreadCountResult>(
        unreadCountQueryKey,
        (current) =>
          current
            ? { unreadCount: Math.max(0, current.unreadCount - 1) }
            : current,
      );
    },
    onSuccess: ({ notification }) => {
      if (!userId) {
        return;
      }

      queryClient.setQueriesData<InfiniteData<NotificationRecordListResult>>(
        { queryKey: getNotificationsQueryScope(userId) },
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === notification.id ? notification : item,
              ),
            })),
          };
        },
      );

      invalidateNotifications();
    },
    onSettled: invalidateNotifications,
  });
}

export { useMarkNotificationReadMutation };
