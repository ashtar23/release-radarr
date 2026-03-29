import { ThemedText } from "@/components/themed-text";
import { defaultStackScreenOptions } from "@/constants/navigation";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { router, Stack } from "expo-router";
import { Platform, Pressable, StyleSheet } from "react-native";

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        ...defaultStackScreenOptions,
        headerLargeTitleEnabled: false,
        headerTintColor: theme.text,
        headerBackVisible: Platform.OS === "android",
        headerLeft:
          Platform.OS === "ios"
            ? () => (
                <Pressable
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel="Close auth"
                  style={styles.dismissButton}
                >
                  <ThemedText style={{ color: theme.interactive.linkPrimary }}>
                    Cancel
                  </ThemedText>
                </Pressable>
              )
            : undefined,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Sign In",
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "Create Account",
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: "Check your email",
          headerTitleAlign: "center",
          headerBackVisible: false,
          headerLeft:
            Platform.OS === "ios"
              ? () => (
                  <Pressable
                    onPress={() => router.dismiss()}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                    style={styles.dismissButton}
                  >
                    <ThemedText style={{ color: theme.interactive.linkPrimary }}>
                      Done
                    </ThemedText>
                  </Pressable>
                )
              : undefined,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  dismissButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
});
