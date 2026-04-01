import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type TitleDetailsStateViewMode =
  | "config-error"
  | "invalid-title"
  | "loading"
  | "request-error";

type TitleDetailsStateViewProps = {
  mode: TitleDetailsStateViewMode;
  errorMessage?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function TitleDetailsStateView({
  mode,
  errorMessage,
  onRetry,
  retrying = false,
}: TitleDetailsStateViewProps) {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };

  if (mode === "loading") {
    return (
      <TitleDetailsStateFrame>
        <EmptyState
          title="Loading title details..."
          description="Pulling the latest information for this game."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </TitleDetailsStateFrame>
    );
  }

  if (mode === "config-error") {
    return (
      <TitleDetailsStateFrame>
        <EmptyState
          title="Title details are unavailable"
          description={errorMessage}
          action={
            <ThemedText style={errorTextStyle}>
              Check the title details API configuration for this build.
            </ThemedText>
          }
        />
      </TitleDetailsStateFrame>
    );
  }

  if (mode === "invalid-title") {
    return (
      <TitleDetailsStateFrame>
        <EmptyState
          title="Invalid title"
          description="This title could not be opened."
        />
      </TitleDetailsStateFrame>
    );
  }

  return (
    <TitleDetailsStateFrame>
      <EmptyState
        title="Couldn&apos;t load title details"
        description={
          errorMessage ?? "Something went wrong while loading title details."
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
    </TitleDetailsStateFrame>
  );
}

function TitleDetailsStateFrame({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Spacing.three,
  },
});
