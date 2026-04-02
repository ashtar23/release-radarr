import type { NotificationRecordListResult } from "@repo/types";
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthGate } from "@/auth/use-auth-gate";
import { supabase } from "@/lib/supabase";

import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotifications,
  notificationsConfigError,
} from "../data-access/notifications";
import {
  getNotificationPreferencesQueryKey,
  getNotificationUnreadCountQueryKey,
  getNotificationsQueryKey,
  getNotificationsQueryScope,
} from "../queries/notifications-query-key";
import { NOTIFICATIONS_PAGE_SIZE } from "../queries/use-notifications-query";

type NotificationRecordRealtimeRow = {
  read_at: string | null;
};

export function NotificationsRealtimeSync() {
  const queryClient = useQueryClient();
  const { state, user } = useAuthGate();
  const userId = state === "ready" ? (user?.id ?? null) : null;
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const client = supabase;

    if (!client || !userId) {
      return;
    }

    const invalidateNotificationQueries = () => {
      void queryClient.invalidateQueries({
        queryKey: getNotificationsQueryScope(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: getNotificationUnreadCountQueryKey(userId),
      });
    };

    const channel = client
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_records",
          filter: `user_id=eq.${userId}`,
        },
        invalidateNotificationQueries,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notification_records",
          filter: `user_id=eq.${userId}`,
        },
        (
          payload: RealtimePostgresUpdatePayload<NotificationRecordRealtimeRow>,
        ) => {
          if (payload.old.read_at === payload.new.read_at) {
            return;
          }

          invalidateNotificationQueries();
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [queryClient, userId]);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;

    if (
      !userId ||
      notificationsConfigError !== null ||
      previousUserId === userId
    ) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: getNotificationUnreadCountQueryKey(userId),
      queryFn: () => getNotificationUnreadCount(),
    });

    void queryClient.prefetchInfiniteQuery({
      queryKey: getNotificationsQueryKey(userId),
      initialPageParam: null as string | null,
      queryFn: ({ pageParam, signal }) =>
        listNotifications({
          signal,
          cursor: typeof pageParam === "string" ? pageParam : undefined,
          limit: NOTIFICATIONS_PAGE_SIZE,
        }),
      getNextPageParam: (lastPage: NotificationRecordListResult) =>
        lastPage.nextCursor ?? undefined,
    });

    void queryClient.prefetchQuery({
      queryKey: getNotificationPreferencesQueryKey(userId),
      queryFn: () => getNotificationPreferences(),
    });
  }, [queryClient, userId]);

  return null;
}
