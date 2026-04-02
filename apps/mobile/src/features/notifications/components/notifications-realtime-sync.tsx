import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthGate } from "@/auth/use-auth-gate";
import { supabase } from "@/lib/supabase";

import {
  getNotificationUnreadCountQueryKey,
  getNotificationsQueryScope,
} from "../queries/notifications-query-key";

type NotificationRecordRealtimeRow = {
  read_at: string | null;
};

export function NotificationsRealtimeSync() {
  const queryClient = useQueryClient();
  const { state, user } = useAuthGate();
  const userId = state === "ready" ? (user?.id ?? null) : null;

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

  return null;
}
