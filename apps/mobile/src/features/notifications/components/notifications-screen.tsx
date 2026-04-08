import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { CenteredOfflineState } from "@/components/centered-offline-state";
import { OfflineBanner } from "@/components/offline-banner";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useIsOffline } from "@/lib/react-query-online";
import { useProtectedOfflineRetry } from "@/lib/offline-screen";

import { useNotificationsScreen } from "../hooks/use-notifications-screen";
import { NotificationsList } from "./notifications-list";
import { NotificationsStateView } from "./notifications-state-view";

export function NotificationsScreen() {
  const isOffline = useIsOffline();
  const { state, retry, retrying } = useNotificationsScreen();
  const theme = useTheme();
  const readyState = state.mode === "ready" ? state : null;
  const offlineRetry = useProtectedOfflineRetry({
    onRetryReady: retry,
    retrying,
  });
  const canKeepShowingContentOffline =
    state.mode === "ready" || state.mode === "empty";

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

  if (isOffline && !canKeepShowingContentOffline) {
    return (
      <CenteredOfflineState
        description="Reconnect to load notifications and mark alerts as read."
        onRetry={offlineRetry.onRetry}
        retrying={offlineRetry.retrying}
      />
    );
  }

  return (
    <>
      <HeaderActions actions={headerActions} />
      {state.mode !== "ready" ? (
        <NotificationsStateView state={state} />
      ) : (
        <NotificationsList
          notifications={state.notifications}
          refreshing={state.refreshing}
          onRefresh={state.onRefresh}
          hasMoreNotifications={state.hasMoreNotifications}
          isLoadingMore={state.isLoadingMore}
          onEndReached={state.loadMoreNotifications}
          onMarkAsRead={state.markAsRead}
          listHeader={
            isOffline ? (
              <OfflineBanner
                message="You’re offline. Showing your last loaded notifications state."
                style={styles.offlineBanner}
              />
            ) : null
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
});
