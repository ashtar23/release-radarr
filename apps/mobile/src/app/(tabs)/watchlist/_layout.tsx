import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";
import { useAuth } from "@/auth/auth-provider";

export default function WatchlistLayout() {
  const { user, isReady } = useAuth();
  const showWatchlistHeader = isReady && Boolean(user);

  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Watchlist",
          headerLargeTitleEnabled: showWatchlistHeader,
        }}
      />
    </Stack>
  );
}
