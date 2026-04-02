import { useMemo } from "react";

import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { useTheme } from "@/hooks/use-theme";

import { useNotificationsFeature } from "../hooks/use-notifications-feature";
import { NotificationsList } from "./notifications-list";
import { NotificationsStateView } from "./notifications-state-view";

export function NotificationsScreen() {
  const {
    unreadCount,
    isMarkingAllAsRead,
    markAllAsRead,
    mode,
    configError,
    notifications,
    refreshing,
    onRefresh,
    hasMoreNotifications,
    isLoadingMore,
    loadMoreNotifications,
    markAsRead,
  } = useNotificationsFeature();
  const theme = useTheme();

  const headerActions = useMemo<HeaderAction[]>(() => {
    if (unreadCount === 0) {
      return [];
    }

    return [
      {
        kind: "button",
        id: "mark-all-notifications-read",
        label: "Mark all as read",
        iosIcon: "checkmark.circle",
        androidIcon: "done_all",
        tintColor: theme.text,
        disabled: isMarkingAllAsRead,
        onPress: () => {
          void markAllAsRead();
        },
      },
    ];
  }, [isMarkingAllAsRead, markAllAsRead, theme.text, unreadCount]);

  const header = <HeaderActions actions={headerActions} />;

  if (mode === "checking-session") {
    return (
      <>
        {header}
        <NotificationsStateView mode="checking-session" />
      </>
    );
  }

  if (mode === "config-error") {
    return (
      <>
        {header}
        <NotificationsStateView
          mode="config-error"
          errorMessage={configError}
        />
      </>
    );
  }

  if (mode === "signed-out") {
    return (
      <>
        {header}
        <NotificationsStateView mode="signed-out" />
      </>
    );
  }

  if (mode === "loading") {
    return (
      <>
        {header}
        <NotificationsStateView mode="loading" />
      </>
    );
  }

  if (mode === "ready") {
    return (
      <>
        {header}

        <NotificationsList
          notifications={notifications}
          refreshing={refreshing}
          onRefresh={onRefresh}
          hasMoreNotifications={hasMoreNotifications}
          isLoadingMore={isLoadingMore}
          onEndReached={loadMoreNotifications}
          onMarkAsRead={markAsRead}
        />
      </>
    );
  }

  return (
    <>
      {header}

      <CenteredStateFrame>
        <EmptyState
          title="No notifications yet"
          description="We'll send you updates about your watchlist here."
        />
      </CenteredStateFrame>
    </>
  );
}
