import type {
  NotificationPreferences,
  NotificationPreferencesResult,
  NotificationRecordListResult,
  NotificationTimingPreset,
} from "@repo/types";
import { notificationTimingPresetValues } from "@repo/types";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";
import { useAuthGate } from "@/auth/use-auth-gate";
import { notificationsRealtimeUrl } from "@/lib/api-client";

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

type NotificationsRealtimeMessage =
  | { type: "ready" }
  | { type: "pong" }
  | { type: "error"; message: string }
  | { type: "notifications.changed"; scope: "records" }
  | {
      type: "notifications.changed";
      scope: "preferences";
      preferences?: NotificationPreferencesResult;
    };

export function NotificationsRealtimeProvider() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { state, user } = useAuthGate();
  const userId = state === "ready" ? (user?.id ?? null) : null;
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !notificationsRealtimeUrl) {
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

    const syncNotificationPreferences = (
      nextPreferences: NotificationPreferencesResult,
    ) => {
      const queryKey = getNotificationPreferencesQueryKey(userId);
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

    const invalidateNotificationPreferences = () => {
      void queryClient.invalidateQueries({
        queryKey: getNotificationPreferencesQueryKey(userId),
      });
    };

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

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

      socket.onopen = () => {
        const accessToken = session?.access_token;
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
        if (!payload || payload.type !== "notifications.changed") {
          return;
        }

        if (payload.scope === "records") {
          invalidateNotificationQueries();
          return;
        }

        if (payload.preferences) {
          syncNotificationPreferences(payload.preferences);
          return;
        }

        invalidateNotificationPreferences();
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
  }, [queryClient, session?.access_token, userId]);

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

    if (parsed.type === "notifications.changed" && parsed.scope === "records") {
      return {
        type: "notifications.changed",
        scope: "records",
      };
    }

    if (
      parsed.type === "notifications.changed" &&
      parsed.scope === "preferences"
    ) {
      return {
        type: "notifications.changed",
        scope: "preferences",
        ...(isNotificationPreferencesPayload(parsed.preferences)
          ? {
              preferences: {
                preferences: parsed.preferences,
              },
            }
          : {}),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isNotificationPreferencesPayload(
  value: unknown,
): value is NotificationPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const channels = record.channels;
  const events = record.events;

  return (
    channels != null &&
    typeof channels === "object" &&
    typeof (channels as Record<string, unknown>).inApp === "boolean" &&
    typeof (channels as Record<string, unknown>).push === "boolean" &&
    events != null &&
    typeof events === "object" &&
    typeof (events as Record<string, unknown>).releaseApproaching ===
      "boolean" &&
    typeof (events as Record<string, unknown>).releaseDateChanged ===
      "boolean" &&
    Array.isArray(record.timingPresets) &&
    record.timingPresets.every(
      (preset) =>
        typeof preset === "string" &&
        notificationTimingPresetValues.includes(
          preset as NotificationTimingPreset,
        ),
    ) &&
    typeof record.updatedAt === "string"
  );
}
