import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, useColorScheme } from "react-native";

import { useAuthGate } from "@/auth/use-auth-gate";
import { capabilities } from "@/constants/capabilities";
import { Colors } from "@/constants/theme";
import { useNotificationUnreadCountQuery } from "@/features/notifications/queries/use-notification-unread-count-query";

export default function AppTabs() {
  const { state } = useAuthGate();
  const unreadCountQuery = useNotificationUnreadCountQuery();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const unreadCount =
    state === "ready" ? (unreadCountQuery.data?.unreadCount ?? 0) : 0;
  const unreadCountBadge =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <NativeTabs
      backgroundColor={Platform.OS === "ios" ? undefined : colors.background}
      blurEffect={
        capabilities.tabBlurEffect ? "systemChromeMaterial" : undefined
      }
      indicatorColor={colors.backgroundElement}
      minimizeBehavior={capabilities.tabMinimize ? "onScrollDown" : undefined}
      labelVisibilityMode={Platform.OS === "android" ? "labeled" : undefined}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.text },
      }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house"
          renderingMode="template"
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="watchlist">
        <NativeTabs.Trigger.Label>Watchlist</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bookmark" md="bookmark" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notifications">
        <NativeTabs.Trigger.Label>Notifications</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bell" md="notifications" />
        <NativeTabs.Trigger.Badge hidden={unreadCountBadge == null}>
          {unreadCountBadge ?? undefined}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="search"
        role={capabilities.tabSearchRole ? "search" : undefined}
      >
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
