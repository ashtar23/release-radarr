import { useCallback, useState } from "react";
import type { NotificationRecord } from "@repo/types";

import { useAuthGate } from "@/auth/use-auth-gate";
import { extractErrorMessage } from "@/lib/extract-error-message";

import { notificationsConfigError } from "../data-access/notifications";
import { useMarkAllNotificationsReadMutation } from "../mutations/use-mark-all-notifications-read-mutation";
import { useMarkNotificationReadMutation } from "../mutations/use-mark-notification-read-mutation";
import { useNotificationUnreadCountQuery } from "../queries/use-notification-unread-count-query";
import { useNotificationsQuery } from "../queries/use-notifications-query";
import {
  deriveNotificationsScreenState,
  type NotificationsScreenReadyState,
} from "../screen-state";

const EMPTY_NOTIFICATIONS: NotificationRecord[] = [];

export function useNotificationsScreen() {
  const {
    state: authGateState,
    isSignedIn,
    configError: authConfigError,
  } = useAuthGate();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const {
    data: notificationsData,
    error: notificationsError,
    isError: hasNotificationsError,
    isPending: isNotificationsPending,
    refetch: refetchNotifications,
    fetchNextPage: fetchNextNotificationsPage,
    hasNextPage: hasNextNotificationsPage,
    isFetchingNextPage: isLoadingNextNotificationsPage,
  } = useNotificationsQuery();

  const {
    data: unreadCountData,
    error: unreadCountError,
    isError: hasUnreadCountError,
    refetch: refetchUnreadCount,
  } = useNotificationUnreadCountQuery();

  const {
    isPending: isMarkingAllAsRead,
    mutateAsync: markAllNotificationsRead,
  } = useMarkAllNotificationsReadMutation();

  const { mutateAsync: markNotificationRead } =
    useMarkNotificationReadMutation();

  const configError = authConfigError ?? notificationsConfigError;
  const canRefresh = authGateState === "ready" && isSignedIn;

  const notifications =
    authGateState === "ready" && isSignedIn
      ? (notificationsData?.pages.flatMap((page) => page.items) ??
        EMPTY_NOTIFICATIONS)
      : EMPTY_NOTIFICATIONS;

  const unreadCount =
    authGateState === "ready" && isSignedIn
      ? (unreadCountData?.unreadCount ?? 0)
      : 0;

  const hasNotificationsData = notificationsData !== undefined;
  const isInitialLoading = isNotificationsPending && !hasNotificationsData;
  const hasBlockingRequestError =
    !hasNotificationsData && (hasNotificationsError || hasUnreadCountError);
  const requestErrorMessage = extractErrorMessage(
    notificationsError ?? unreadCountError,
    "Something went wrong while loading notifications.",
  );

  const refreshNotifications = useCallback(async () => {
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

  const retryNotifications = useCallback(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const loadMoreNotifications = useCallback(() => {
    if (!hasNextNotificationsPage || isLoadingNextNotificationsPage) {
      return;
    }

    void fetchNextNotificationsPage({ cancelRefetch: false });
  }, [
    fetchNextNotificationsPage,
    hasNextNotificationsPage,
    isLoadingNextNotificationsPage,
  ]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markNotificationRead({ notificationId });
    },
    [markNotificationRead],
  );

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const readyState: NotificationsScreenReadyState = {
    mode: "ready",
    notifications,
    unreadCount,
    refreshing: isManualRefreshing && notifications.length > 0,
    onRefresh: notifications.length > 0 ? retryNotifications : undefined,
    hasMoreNotifications: Boolean(hasNextNotificationsPage),
    isLoadingMore: isLoadingNextNotificationsPage,
    loadMoreNotifications,
    markAllAsRead,
    markAsRead,
    isMarkingAllAsRead,
  };

  const state = deriveNotificationsScreenState({
    authGateState,
    configError,
    isInitialLoading,
    hasBlockingRequestError,
    requestErrorMessage,
    notificationsCount: notifications.length,
    readyState,
    retrying: isManualRefreshing,
    onRetry: canRefresh ? retryNotifications : undefined,
  });

  return { state };
}
