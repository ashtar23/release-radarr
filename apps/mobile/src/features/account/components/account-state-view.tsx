import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AccountStateViewMode = "loading" | "config-error";

type AccountStateViewProps = {
  mode: AccountStateViewMode;
  errorMessage?: string | null;
};

export function AccountStateView({
  mode,
  errorMessage,
}: AccountStateViewProps) {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };

  if (mode === "loading") {
    return (
      <AccountStateFrame>
        <EmptyState
          title="Checking your session..."
          description="Loading your account access."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </AccountStateFrame>
    );
  }

  return (
    <AccountStateFrame>
      <EmptyState
        title="Account is unavailable"
        description={errorMessage ?? "Account configuration is unavailable."}
        action={
          <ThemedText style={errorTextStyle}>
            Check the Supabase environment configuration for this build.
          </ThemedText>
        }
      />
    </AccountStateFrame>
  );
}

function AccountStateFrame({ children }: { children?: React.ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Spacing.three,
  },
});
