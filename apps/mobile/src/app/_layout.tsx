import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View, useColorScheme } from "react-native";

import { AuthProvider } from "@/auth/auth-provider";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppSheetProvider } from "@/components/sheets";
import { defaultStackScreenOptions } from "@/constants/navigation";
import { Colors } from "@/constants/theme";
import { AppSymbol } from "@/components/app-symbol";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const appThemeColors = Colors[scheme];

  return (
    <QueryClientProvider client={queryClient}>
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
                    name="(modals)/profile"
                    options={{
                      sheetGrabberVisible: false,
                      presentation: "modal",
                      headerTitle: "Profile",
                      headerBackButtonDisplayMode: "minimal",
                      headerLargeTitleEnabled: true,
                      headerRight: () => (
                        <Pressable onPress={() => router.back()}>
                          <AppSymbol
                            ios="xmark"
                            size={18}
                            tintColor={Colors[scheme].text}
                          />
                        </Pressable>
                      ),
                    }}
                  />
                </Stack>
              </View>
            </AppSheetProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </AuthProvider>
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
