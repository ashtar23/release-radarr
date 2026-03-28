import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        ...defaultStackScreenOptions,
        headerLargeTitleEnabled: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "",
        }}
      />

      <Stack.Screen
        name="settings/index"
        options={{
          title: "Settings",
        }}
      />

      <Stack.Screen
        name="settings/general"
        options={{
          title: "General",
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
