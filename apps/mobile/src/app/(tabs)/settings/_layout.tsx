import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
        }}
      />

      <Stack.Screen
        name="general"
        options={{
          title: "General",
        }}
      />

      <Stack.Screen
        name="theme"
        options={{
          title: "Theme",
        }}
      />

      <Stack.Screen
        name="developer"
        options={{
          title: "Developer",
        }}
      />
    </Stack>
  );
}
