import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";
import { useTheme } from "@/hooks/use-theme";

export default function SearchLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        ...defaultStackScreenOptions,
        headerLargeTitleEnabled: false,
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Search",
        }}
      />
    </Stack>
  );
}
