import React from "react";
import { ActivityIndicator } from "react-native";

import { Button } from "@/components/button";
import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

type HomeStateViewMode = "config-error" | "loading" | "request-error";

type HomeStateViewProps = {
  mode: HomeStateViewMode;
  errorMessage?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function HomeStateView({
  mode,
  errorMessage,
  onRetry,
  retrying = false,
}: HomeStateViewProps) {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };

  if (mode === "loading") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Loading discovery..."
          description="Pulling upcoming, latest, and popular games."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  if (mode === "config-error") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Home is unavailable"
          description={errorMessage}
          action={
            <ThemedText style={errorTextStyle}>
              Check the API client environment configuration for this build.
            </ThemedText>
          }
        />
      </CenteredStateFrame>
    );
  }

  return (
    <CenteredStateFrame>
      <EmptyState
        title="Couldn't load discovery"
        description={
          errorMessage ?? "Something went wrong while loading discovery."
        }
        action={
          onRetry ? (
            <Button
              label={retrying ? "Trying again..." : "Try again"}
              tone="neutral"
              loading={retrying}
              disabled={retrying}
              onPress={onRetry}
            />
          ) : undefined
        }
      />
    </CenteredStateFrame>
  );
}
