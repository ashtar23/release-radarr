import React from "react";
import { ActivityIndicator } from "react-native";

import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
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
      <CenteredStateFrame>
        <EmptyState
          title="Checking your session..."
          description="Loading your account access."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  return (
    <CenteredStateFrame>
      <EmptyState
        title="Account is unavailable"
        description={errorMessage ?? "Account configuration is unavailable."}
        action={
          <ThemedText style={errorTextStyle}>
            Check the Supabase environment configuration for this build.
          </ThemedText>
        }
      />
    </CenteredStateFrame>
  );
}
