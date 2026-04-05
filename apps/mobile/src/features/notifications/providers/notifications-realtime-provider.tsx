import type {
  NotificationPreferencesResult,
  NotificationRecordListResult,
  NotificationTimingPreset,
} from "@repo/types";
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthGate } from "@/auth/use-auth-gate";
import { notificationsRealtimeUrl } from "@/lib/api-client";
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

type NotificationPreferencesRealtimeRow = {
  in_app_enabled: boolean;
  push_enabled: boolean;
  release_approaching_enabled: boolean;
  release_date_changed_enabled: boolean;
  timing_presets: string[];
  updated_at: string;
  user_id: string;
};

function mapNotificationPreferencesRealtimeRow(
  row: NotificationPreferencesRealtimeRow,
): NotificationPreferencesResult {
  return {
    preferences: {
      channels: {
        inApp: row.in_app_enabled,
        push: row.push_enabled,
      },
      events: {
        releaseApproaching: row.release_approaching_enabled,
        releaseDateChanged: row.release_date_changed_enabled,
      },
      timingPresets: row.timing_presets as NotificationTimingPreset[],
      updatedAt: row.updated_at,
    },
  };
}

export function NotificationsRealtimeProvider() {
  const queryClient = useQueryClient();
  const { state, user } = useAuthGate();
  const userId = state === "ready" ? (user?.id ?? null) : null;
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const client = supabase;

    const invalidateNotificationQueries = () => {
      void queryClient.invalidateQueries({
        queryKey: getNotificationsQueryScope(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: getNotificationUnreadCountQueryKey(userId),
      });
    };

    const syncNotificationPreferences = (
      row: NotificationPreferencesRealtimeRow,
    ) => {
      const queryKey = getNotificationPreferencesQueryKey(userId);
      const nextPreferences = mapNotificationPreferencesRealtimeRow(row);
      const cachedPreferences =
        queryClient.getQueryData<NotificationPreferencesResult>(queryKey);

      if (
        cachedPreferences &&
        cachedPreferences.preferences.updatedAt >=
          nextPreferences.preferences.updatedAt
      ) {
        return;
      }

      queryClient.setQueryData(queryKey, nextPreferences);
    };

    if (notificationsRealtimeUrl) {
      if (!client) {
        return;
      }

      let socket: WebSocket | null = null;
      let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
      let disposed = false;

      const invalidateNotificationPreferences = () => {
        void queryClient.invalidateQueries({
          queryKey: getNotificationPreferencesQueryKey(userId),
        });
      };

      const scheduleReconnect = () => {
        if (disposed || reconnectTimeout) {
          return;
        }

        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          connect();
        }, 2_000);
      };

      const connect = () => {
        socket = new WebSocket(
          `${notificationsRealtimeUrl}/notifications/stream`,
        );

        socket.onopen = async () => {
          const { data } = await client.auth.getSession();
          const accessToken = data.session?.access_token;

          if (!accessToken) {
            socket?.close();
            return;
          }

          socket?.send(
            JSON.stringify({
              type: "auth",
              accessToken,
            }),
          );
        };

        socket.onmessage = (event) => {
          const payload = parseRealtimeMessage(event.data);
          if (!payload) {
            return;
          }

          if (payload.type !== "notifications.changed") {
            return;
          }

          if (payload.scope === "records") {
            invalidateNotificationQueries();
            return;
          }

          if (payload.scope === "preferences") {
            invalidateNotificationPreferences();
          }
        };

        socket.onerror = () => {
          socket?.close();
        };

        socket.onclose = () => {
          if (!disposed) {
            scheduleReconnect();
          }
        };
      };

      connect();

      return () => {
        disposed = true;

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }

        socket?.close();
      };
    }

    if (!client) {
      return;
    }

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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_preferences",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: NotificationPreferencesRealtimeRow }) => {
          syncNotificationPreferences(payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notification_preferences",
          filter: `user_id=eq.${userId}`,
        },
        (
          payload: RealtimePostgresUpdatePayload<NotificationPreferencesRealtimeRow>,
        ) => {
          syncNotificationPreferences(payload.new);
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

type NotificationsRealtimeMessage =
  | {
      type: "ready";
    }
  | {
      type: "pong";
    }
  | {
      type: "error";
      message: string;
    }
  | {
      type: "notifications.changed";
      scope: "records" | "preferences";
    };

function parseRealtimeMessage(
  value: string | Blob | ArrayBuffer | ArrayBufferView,
): NotificationsRealtimeMessage | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    if (parsed.type === "ready" || parsed.type === "pong") {
      return { type: parsed.type };
    }

    if (parsed.type === "error" && typeof parsed.message === "string") {
      return {
        type: "error",
        message: parsed.message,
      };
    }

    if (
      parsed.type === "notifications.changed" &&
      (parsed.scope === "records" || parsed.scope === "preferences")
    ) {
      return {
        type: "notifications.changed",
        scope: parsed.scope,
      };
    }
  } catch {
    return null;
  }

  return null;
}
