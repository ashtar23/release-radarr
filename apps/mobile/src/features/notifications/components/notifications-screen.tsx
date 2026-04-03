import { useMemo } from "react";

import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { useTheme } from "@/hooks/use-theme";

import { useNotificationsScreen } from "../hooks/use-notifications-screen";
import { NotificationsList } from "./notifications-list";
import { NotificationsStateView } from "./notifications-state-view";

export function NotificationsScreen() {
  const { state } = useNotificationsScreen();
  const theme = useTheme();
  const readyState = state.mode === "ready" ? state : null;

  const headerActions = useMemo<HeaderAction[]>(() => {
    if (readyState == null || readyState.unreadCount === 0) {
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
        disabled: readyState.isMarkingAllAsRead,
        onPress: () => {
          void readyState.markAllAsRead();
        },
      },
    ];
  }, [readyState, theme.text]);

  if (state.mode !== "ready") {
    return (
      <>
        <HeaderActions actions={headerActions} />
        <NotificationsStateView state={state} />
      </>
    );
  }

  return (
    <>
      <HeaderActions actions={headerActions} />
      <NotificationsList
        notifications={state.notifications}
        refreshing={state.refreshing}
        onRefresh={state.onRefresh}
        hasMoreNotifications={state.hasMoreNotifications}
        isLoadingMore={state.isLoadingMore}
        onEndReached={state.loadMoreNotifications}
        onMarkAsRead={state.markAsRead}
      />
    </>
  );
}
