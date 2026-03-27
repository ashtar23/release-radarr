import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";
import { useTopLevelProfileHeaderOptions } from "@/features/navigation/header-actions";

export default function WatchlistLayout() {
  const profileHeaderOptions = useTopLevelProfileHeaderOptions();

  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Watchlist",
          ...profileHeaderOptions,
        }}
      />
    </Stack>
  );
}
