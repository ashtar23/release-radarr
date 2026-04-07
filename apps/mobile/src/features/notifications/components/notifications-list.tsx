import React, { useCallback, type ReactElement } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import type { NotificationRecord } from "@repo/types";

import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { NotificationsRow } from "./notifications-row";

type NotificationsListProps = {
  notifications: NotificationRecord[];
  refreshing: boolean;
  onRefresh?: () => void;
  hasMoreNotifications: boolean;
  isLoadingMore: boolean;
  onEndReached: () => void;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  listHeader?: ReactElement | null;
};

export function NotificationsList({
  notifications,
  refreshing,
  onRefresh,
  hasMoreNotifications,
  isLoadingMore,
  onEndReached,
  onMarkAsRead,
  listHeader,
}: NotificationsListProps) {
  const router = useRouter();
  const theme = useTheme();

  const handleNotificationPress = useCallback(
    (notification: NotificationRecord) => {
      if (notification.readAt == null) {
        void onMarkAsRead(notification.id).catch((error) => {
          console.error("Failed to mark notification as read.", {
            notificationId: notification.id,
            destinationTitleId: notification.destinationTitleId,
            error,
          });
        });
      }

      router.push(`/titles/${notification.destinationTitleId}`);
    },
    [onMarkAsRead, router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<NotificationRecord>) => (
      <NotificationsRow
        notification={item}
        onPress={() => {
          handleNotificationPress(item);
        }}
      />
    ),
    [handleNotificationPress],
  );

  const keyExtractor = useCallback((item: NotificationRecord) => item.id, []);

  return (
    <FlashList
      style={styles.list}
      data={notifications}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      maintainVisibleContentPosition={{ disabled: true }}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={listHeader}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ItemSeparatorComponent={() => (
        <ItemSeparator separatorColor={theme.separator} />
      )}
      drawDistance={320}
      ListFooterComponent={
        <NotificationsListFooter
          hasMoreNotifications={hasMoreNotifications}
          isLoadingMore={isLoadingMore}
          loadingColor={theme.text}
        />
      }
    />
  );
}

function ItemSeparator({ separatorColor }: { separatorColor: string }) {
  return (
    <View style={[styles.separator, { backgroundColor: separatorColor }]} />
  );
}

function NotificationsListFooter({
  hasMoreNotifications,
  isLoadingMore,
  loadingColor,
}: {
  hasMoreNotifications: boolean;
  isLoadingMore: boolean;
  loadingColor: string;
}) {
  if (isLoadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={loadingColor} />
      </View>
    );
  }

  if (hasMoreNotifications) {
    return (
      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Scroll for more
        </ThemedText>
      </View>
    );
  }

  return <View style={styles.footer} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.one,
    paddingBottom: Spacing.four,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    minHeight: Spacing.five,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
  },
});
