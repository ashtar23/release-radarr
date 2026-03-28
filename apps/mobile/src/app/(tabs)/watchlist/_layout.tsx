import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";

export default function WatchlistLayout() {
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Watchlist",
        }}
      />
    </Stack>
  );
}
