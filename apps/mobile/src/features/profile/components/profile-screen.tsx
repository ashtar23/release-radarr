import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useAuth } from "@/auth/auth-provider";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ProfileSignedIn } from "./profile-signed-in";
import { ProfileSignedOut } from "./profile-signed-out";

export function ProfileScreen() {
  const theme = useTheme();
  const { user, isReady, configError } = useAuth();

  const canSubmit = isReady && !configError;
  const errorTextStyle = { color: theme.status.error };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior={
          capabilities.autoContentInsets ? "automatic" : "never"
        }
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!isReady ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <ThemedText themeColor="textSecondary">
              Checking session...
            </ThemedText>
          </View>
        ) : null}

        {configError ? (
          <ThemedText style={errorTextStyle}>{configError}</ThemedText>
        ) : null}

        {user ? (
          <ProfileSignedIn
            canSubmit={canSubmit}
            email={user.email}
            onSignedOut={() => {}}
          />
        ) : (
          <ProfileSignedOut canSubmit={canSubmit} configError={configError} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
});
