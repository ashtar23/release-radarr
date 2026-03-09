import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { AuthProvider } from "@/auth/auth-provider";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Colors } from "@/constants/theme";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const appThemeColors = Colors[scheme];

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <View
            style={[
              styles.root,
              {
                backgroundColor: appThemeColors.background,
              },
            ]}
          >
            <AnimatedSplashOverlay />
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  title: "Home",
                }}
              />
              <Stack.Screen
                name="titles/[titleId]"
                options={{
                  title: "Title",
                  headerBackButtonDisplayMode: "minimal",
                  headerLargeTitle: Platform.OS === "ios",
                  headerShadowVisible: false,
                  headerTransparent: Platform.OS === "ios",
                }}
              />
            </Stack>
          </View>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
