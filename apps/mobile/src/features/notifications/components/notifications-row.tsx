import type { NotificationRecord } from "@repo/types";
import { StyleSheet, View } from "react-native";

import { ActionRow } from "@/components/action-row";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type NotificationsRowProps = {
  notification: NotificationRecord;
  onPress: () => void;
};

export function NotificationsRow({
  notification,
  onPress,
}: NotificationsRowProps) {
  const theme = useTheme();
  const showUnreadDot = notification.readAt == null;

  return (
    <ActionRow onPress={onPress}>
      <View style={styles.row}>
        {showUnreadDot ? (
          <View style={styles.leading}>
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: theme.interactive.linkPrimary },
              ]}
            />
          </View>
        ) : null}

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.title}
            >
              {notification.titleName}
            </ThemedText>

            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.timestamp}
            >
              {formatRelativeTime(notification.createdAt)}
            </ThemedText>
          </View>

          <ThemedText style={styles.eventHeadline}>
            {getNotificationEventLabel(notification)}
          </ThemedText>

          {notification.subtitle ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.subtitle}
              numberOfLines={2}
            >
              {notification.subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </ActionRow>
  );
}

function getNotificationEventLabel(notification: NotificationRecord) {
  switch (notification.eventType) {
    case "release_date_changed":
      return "Release date changed";
    case "release_approaching":
      return "Releasing soon";
    default:
      return "Update";
  }
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value);
  const diffInMs = Date.now() - timestamp.getTime();

  if (!Number.isFinite(diffInMs) || diffInMs < 0) {
    return timestamp.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  if (diffInMinutes < 1) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return timestamp.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.two + Spacing.one,
  },
  leading: {
    width: 14,
    alignItems: "center",
    paddingTop: 7,
    marginRight: Spacing.two,
  },
  content: {
    flex: 1,
    gap: Spacing.half,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  timestamp: {
    flexShrink: 0,
    textAlign: "right",
  },
  eventHeadline: {
    lineHeight: 22,
    fontWeight: 700,
  },
  subtitle: {
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
});
