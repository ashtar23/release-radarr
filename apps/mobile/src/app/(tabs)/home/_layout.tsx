import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerLargeTitle: Platform.OS === "ios",
        headerShadowVisible: false,
        headerTransparent: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Release Radarr",
        }}
      />
    </Stack>
  );
}
