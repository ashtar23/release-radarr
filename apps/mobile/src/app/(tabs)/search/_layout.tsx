import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: "Search",
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerTransparent: Platform.OS === "ios",
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
