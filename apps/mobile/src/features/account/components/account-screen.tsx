import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { useAuth } from "@/auth/auth-provider";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { AccountSignedIn } from "./account-signed-in";
import { AccountSignedOut } from "./account-signed-out";

export function AccountScreen() {
  const theme = useTheme();
  const { user, isReady, configError } = useAuth();

  const canSubmit = isReady && !configError;
  const errorTextStyle = { color: theme.status.error };

  return (
    <ScrollView
      style={styles.scrollView}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
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
        <AccountSignedIn
          canSubmit={canSubmit}
          email={user.email}
          onSignedOut={() => {}}
        />
      ) : (
        <AccountSignedOut />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
