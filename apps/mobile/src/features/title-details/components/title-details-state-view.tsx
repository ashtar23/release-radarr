import React from "react";
import { ActivityIndicator } from "react-native";

import { Button } from "@/components/button";
import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
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
      <CenteredStateFrame>
        <EmptyState
          title="Loading title details..."
          description="Pulling the latest information for this game."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  if (mode === "config-error") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Title details are unavailable"
          description={errorMessage}
          action={
            <ThemedText style={errorTextStyle}>
              Check the title details API configuration for this build.
            </ThemedText>
          }
        />
      </CenteredStateFrame>
    );
  }

  if (mode === "invalid-title") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Invalid title"
          description="This title could not be opened."
        />
      </CenteredStateFrame>
    );
  }

  return (
    <CenteredStateFrame>
      <EmptyState
        title="Couldn't load title details"
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
    </CenteredStateFrame>
  );
}
