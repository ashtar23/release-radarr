import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";
import { useAuth } from "@/auth/auth-provider";

export default function AccountLayout() {
  const { user, isReady } = useAuth();

  const showAccountHeader = isReady && Boolean(user);
  return (
    <Stack
      screenOptions={{
        ...defaultStackScreenOptions,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: showAccountHeader ? "Account" : "",
          headerLargeTitleEnabled: showAccountHeader,
        }}
      />

      <Stack.Screen
        name="settings/index"
        options={{
          title: "Settings",
        }}
      />

      <Stack.Screen
        name="settings/general/index"
        options={{
          title: "General",
        }}
      />

      <Stack.Screen
        name="settings/general/watchlist"
        options={{
          title: "Watchlist Sorting",
        }}
      />

      <Stack.Screen
        name="settings/theme"
        options={{
          title: "Theme",
        }}
      />

      <Stack.Screen
        name="settings/developer"
        options={{
          title: "Developer",
        }}
      />
    </Stack>
  );
}
