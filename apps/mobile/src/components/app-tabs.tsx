import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={Platform.OS === "ios" ? undefined : colors.background}
      blurEffect={Platform.OS === "ios" ? "systemChromeMaterial" : undefined}
      indicatorColor={colors.backgroundElement}
      minimizeBehavior={Platform.OS === "ios" ? "onScrollDown" : undefined}
      labelStyle={{ selected: { color: colors.text } }}
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

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
