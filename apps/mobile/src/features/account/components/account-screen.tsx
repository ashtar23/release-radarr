import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useAuth } from "@/auth/auth-provider";
import { ThemedText } from "@/components/themed-text";
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
    <ScreenScrollView>
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
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
});
