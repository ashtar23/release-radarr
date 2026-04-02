import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";

import { useNotificationsFeature } from "../hooks/use-notifications-feature";
import { NotificationsList } from "./notifications-list";
import { NotificationsStateView } from "./notifications-state-view";

export function NotificationsScreen() {
  const notificationsFeature = useNotificationsFeature();

  console.log("notificationsFeature", notificationsFeature.notifications);

  if (notificationsFeature.mode === "checking-session") {
    return <NotificationsStateView mode="checking-session" />;
  }

  if (notificationsFeature.mode === "config-error") {
    return (
      <NotificationsStateView
        mode="config-error"
        errorMessage={notificationsFeature.configError}
      />
    );
  }

  if (notificationsFeature.mode === "signed-out") {
    return <NotificationsStateView mode="signed-out" />;
  }

  if (notificationsFeature.mode === "loading") {
    return <NotificationsStateView mode="loading" />;
  }

  if (notificationsFeature.mode === "ready") {
    return (
      <NotificationsList
        notifications={notificationsFeature.notifications}
        refreshing={notificationsFeature.refreshing}
        onRefresh={notificationsFeature.onRefresh}
        hasMoreNotifications={notificationsFeature.hasMoreNotifications}
        isLoadingMore={notificationsFeature.isLoadingMore}
        onEndReached={notificationsFeature.loadMoreNotifications}
        onMarkAsRead={notificationsFeature.markAsRead}
      />
    );
  }

  return (
    <CenteredStateFrame>
      <EmptyState
        title="No notifications yet"
        description="We'll send you updates about your watchlist here."
      />
    </CenteredStateFrame>
  );
}
