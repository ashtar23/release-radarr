import { useCallback } from "react";
import type { NotificationRecord } from "@repo/types";

import { useAuthGate } from "@/auth/use-auth-gate";
import { useManualRefresh } from "@/hooks/use-manual-refresh";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { useIsOffline } from "@/lib/react-query-online";

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
  const isOffline = useIsOffline();
  const {
    state: authGateState,
    isSignedIn,
    configError: authConfigError,
  } = useAuthGate();

  const {
    data: notificationsData,
    error: notificationsError,
    isError: hasNotificationsError,
    isPending: isNotificationsPending,
    isRefetching: isNotificationsRefetching,
    refetch: refetchNotifications,
    fetchNextPage: fetchNextNotificationsPage,
    hasNextPage: hasNextNotificationsPage,
    isFetchingNextPage: isLoadingNextNotificationsPage,
  } = useNotificationsQuery();

  const {
    data: unreadCountData,
    error: unreadCountError,
    isError: hasUnreadCountError,
    isRefetching: isUnreadCountRefetching,
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
  const requestErrorMessage = extractErrorMessage(
    notificationsError ?? unreadCountError,
    "Something went wrong while loading notifications.",
  );
  const hasBlockingRequestError =
    !hasNotificationsData && (hasNotificationsError || hasUnreadCountError);
  const refreshNotificationsAction = useCallback(
    () => Promise.all([refetchNotifications(), refetchUnreadCount()]),
    [refetchNotifications, refetchUnreadCount],
  );
  const {
    isRefreshing: isManualRefreshing,
    canRefresh: canManualRefresh,
    refresh: refreshNotifications,
  } = useManualRefresh({
    enabled: canRefresh,
    hasData: hasNotificationsData,
    isOffline,
    refreshAction: refreshNotificationsAction,
  });

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
    onRefresh: notifications.length > 0 && canManualRefresh ? retryNotifications : undefined,
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
    retrying:
      !hasNotificationsData &&
      (isNotificationsRefetching || isUnreadCountRefetching),
    onRetry: canRefresh ? retryNotifications : undefined,
  });

  return {
    state,
    retry: retryNotifications,
    retrying:
      !hasNotificationsData &&
      (isNotificationsRefetching || isUnreadCountRefetching),
  };
}
