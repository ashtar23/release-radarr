import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";
import { ListSection } from "@/components/list-section";
import { ScreenPrompt } from "@/components/screen-prompt";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { SignInLinkRow } from "@/components/sign-in-link-row";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator } from "react-native";

type NotificationsStateViewMode =
  | "checking-session"
  | "config-error"
  | "signed-out"
  | "loading";

type NotificationsStateViewProps = {
  mode: NotificationsStateViewMode;
  errorMessage?: string | null;
};

export function NotificationsStateView({
  mode,
  errorMessage,
}: NotificationsStateViewProps) {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };

  if (mode === "checking-session") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Checking your session..."
          description="Loading your notifications access."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  if (mode === "config-error") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Notifications are unavailable"
          description={
            errorMessage ?? "Notification configuration is unavailable."
          }
          action={
            <ThemedText style={errorTextStyle}>
              Check the Supabase environment configuration for this build.
            </ThemedText>
          }
        />
      </CenteredStateFrame>
    );
  }

  if (mode === "signed-out") {
    return (
      <ScreenScrollView>
        <ScreenPrompt
          icon={{ ios: "bell", android: "notifications" }}
          title="Stay in the loop"
          description="Sign in to receive notifications about your watchlist."
          actionContent={
            <ListSection>
              <SignInLinkRow />
            </ListSection>
          }
        />
      </ScreenScrollView>
    );
  }

  return (
    <CenteredStateFrame>
      <EmptyState
        title="Loading notifications..."
        description="Pulling the latest updates for your watchlist."
        icon={<ActivityIndicator size="small" color={theme.text} />}
      />
    </CenteredStateFrame>
  );
}
