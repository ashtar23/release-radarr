import type {
  NotificationRecordListResponse,
  NotificationUnreadCountResponse,
} from "@repo/api-client";
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
} from "../queries/notifications-query-key";

export function useMarkAllNotificationsReadMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const invalidateNotifications = () => {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: getNotificationsQueryScope(userId),
    });
    void queryClient.invalidateQueries({
      queryKey: getNotificationUnreadCountQueryKey(userId),
    });
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

      queryClient.setQueriesData<InfiniteData<NotificationRecordListResponse>>(
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

      queryClient.setQueryData<NotificationUnreadCountResponse>(
        unreadCountQueryKey,
        () => ({ unreadCount: 0 }),
      );
    },
    onSettled: invalidateNotifications,
  });
}
