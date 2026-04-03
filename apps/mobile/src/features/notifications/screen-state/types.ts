import type { NotificationRecord } from "@repo/types";

export type NotificationsScreenReadyState = {
  mode: "ready";
  notifications: NotificationRecord[];
  unreadCount: number;
  refreshing: boolean;
  onRefresh?: () => void;
  hasMoreNotifications: boolean;
  isLoadingMore: boolean;
  loadMoreNotifications: () => void;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  isMarkingAllAsRead: boolean;
};

export type NotificationsScreenNonReadyState =
  | { mode: "checking-session" }
  | { mode: "signed-out" }
  | {
      mode: "config-error";
      errorMessage: string;
    }
  | { mode: "loading" }
  | {
      mode: "request-error";
      errorMessage: string;
      onRetry?: () => void;
      retrying: boolean;
    }
  | { mode: "empty" };

export type NotificationsScreenState =
  | NotificationsScreenNonReadyState
  | NotificationsScreenReadyState;
