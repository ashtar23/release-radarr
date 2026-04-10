import { Stack } from "expo-router";
import React from "react";

import { defaultStackScreenOptions } from "@/constants/navigation";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Discover",
        }}
      />
      <Stack.Screen
        name="[section]"
        options={{
          title: "Discover",
        }}
      />
    </Stack>
  );
}
