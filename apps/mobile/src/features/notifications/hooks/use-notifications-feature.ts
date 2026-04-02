import { useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationRecord } from "@repo/types";
import { match } from "ts-pattern";

import { useAuthGate } from "@/auth/use-auth-gate";

import { notificationsConfigError } from "../data-access/notifications";
import { useMarkAllNotificationsReadMutation } from "../queries/use-mark-all-notifications-read-mutation";
import { useMarkNotificationReadMutation } from "../queries/use-mark-notification-read-mutation";
import { useNotificationUnreadCountQuery } from "../queries/use-notification-unread-count-query";
import { useNotificationsQuery } from "../queries/use-notifications-query";

export type NotificationsScreenMode =
  | "checking-session"
  | "signed-out"
  | "config-error"
  | "loading"
  | "empty"
  | "ready";

const EMPTY_NOTIFICATIONS: NotificationRecord[] = [];

export function useNotificationsFeature() {
  const {
    state: authGateState,
    isSignedIn,
    configError: authConfigError,
  } = useAuthGate();
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useNotificationUnreadCountQuery();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const markReadMutation = useMarkNotificationReadMutation();
  const configError = authConfigError ?? notificationsConfigError;
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const wasFocusedRef = useRef(false);
  const refetchNotifications = notificationsQuery.refetch;
  const refetchUnreadCount = unreadCountQuery.refetch;

  const notifications =
    authGateState === "ready" && isSignedIn
      ? (notificationsQuery.data?.pages.flatMap((page) => page.items) ??
        EMPTY_NOTIFICATIONS)
      : EMPTY_NOTIFICATIONS;
  const unreadCount =
    authGateState === "ready" && isSignedIn
      ? (unreadCountQuery.data?.unreadCount ?? 0)
      : 0;
  const hasNotificationsData = notificationsQuery.data !== undefined;
  const isInitialLoading =
    notificationsQuery.isPending && !hasNotificationsData;
  const canRefresh = authGateState === "ready" && isSignedIn;

  useEffect(() => {
    if (!canRefresh) {
      wasFocusedRef.current = false;
      return;
    }

    if (isFocused && !wasFocusedRef.current) {
      void refetchNotifications();
      void refetchUnreadCount();
    }

    wasFocusedRef.current = isFocused;
  }, [canRefresh, isFocused, refetchNotifications, refetchUnreadCount]);

  const onRefresh = useCallback(async () => {
    if (!canRefresh || isManualRefreshing) {
      return;
    }

    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchNotifications(), refetchUnreadCount()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    canRefresh,
    isManualRefreshing,
    refetchNotifications,
    refetchUnreadCount,
  ]);

  const markAsRead = async (notificationId: string) => {
    await markReadMutation.mutateAsync({ notificationId });
  };

  const markAllAsRead = async () => {
    await markAllReadMutation.mutateAsync();
  };

  const mode: NotificationsScreenMode = match({
    authGateState,
    configError,
    isInitialLoading,
    notificationCount: notifications.length,
  })
    .returnType<NotificationsScreenMode>()
    .with({ authGateState: "checking-session" }, () => "checking-session")
    .with({ authGateState: "signed-out" }, () => "signed-out")
    .with({ authGateState: "config-error" }, () => "config-error")
    .when(
      ({ configError }) => configError != null,
      () => "config-error",
    )
    .with({ isInitialLoading: true }, () => "loading")
    .with({ notificationCount: 0 }, () => "empty")
    .otherwise(() => "ready");

  return {
    mode,
    notifications,
    unreadCount,
    configError,
    canUseNotifications: isSignedIn,
    refreshing: isManualRefreshing && notifications.length > 0,
    onRefresh: notifications.length > 0 ? onRefresh : undefined,
    hasMoreNotifications: Boolean(notificationsQuery.hasNextPage),
    isLoadingMore: notificationsQuery.isFetchingNextPage,
    loadMoreNotifications: notificationsQuery.loadMoreNotifications,
    markAllAsRead,
    markAsRead,
    isMarkingAllAsRead: markAllReadMutation.isPending,
    isMarkingRead: markReadMutation.isPending,
  };
}
