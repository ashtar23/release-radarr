import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
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
      <HomeStateFrame>
        <EmptyState
          title="Loading discovery..."
          description="Pulling upcoming, latest, and popular games."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </HomeStateFrame>
    );
  }

  if (mode === "config-error") {
    return (
      <HomeStateFrame>
        <EmptyState
          title="Home is unavailable"
          description={errorMessage}
          action={
            <ThemedText style={errorTextStyle}>
              Check the API client environment configuration for this build.
            </ThemedText>
          }
        />
      </HomeStateFrame>
    );
  }

  return (
    <HomeStateFrame>
      <EmptyState
        title="Couldn&apos;t load discovery"
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
    </HomeStateFrame>
  );
}

function HomeStateFrame({ children }: { children?: React.ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Spacing.three,
  },
});
