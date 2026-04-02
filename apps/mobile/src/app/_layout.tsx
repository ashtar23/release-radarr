import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";

import { AuthProvider } from "@/auth/auth-provider";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppSheetProvider } from "@/components/sheets";
import { defaultStackScreenOptions } from "@/constants/navigation";
import { Colors } from "@/constants/theme";
import { NotificationsRealtimeSync } from "@/features/notifications/components/notifications-realtime-sync";
import { SearchDebugSettingsProvider } from "@/features/settings/providers/search-debug-settings";
import { AppPreferencesProvider } from "@/features/settings/providers/app-preferences";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const appThemeColors = Colors[scheme];

  return (
    <QueryClientProvider client={queryClient}>
      <AppPreferencesProvider>
        <SearchDebugSettingsProvider>
          <AuthProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <GestureHandlerRootView style={styles.gestureHandlerRoot}>
                <AppSheetProvider>
                  <View
                    style={[
                      styles.root,
                      {
                        backgroundColor: appThemeColors.background,
                      },
                    ]}
                  >
                    <AnimatedSplashOverlay />
                    <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                    <NotificationsRealtimeSync />

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
                          ...defaultStackScreenOptions,
                          title: "Title",
                        }}
                      />

                      <Stack.Screen
                        name="auth"
                        options={{
                          presentation: "modal",
                          headerShown: false,
                        }}
                      />
                    </Stack>
                  </View>
                </AppSheetProvider>
              </GestureHandlerRootView>
            </ThemeProvider>
          </AuthProvider>
        </SearchDebugSettingsProvider>
      </AppPreferencesProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gestureHandlerRoot: {
    flex: 1,
  },
});
