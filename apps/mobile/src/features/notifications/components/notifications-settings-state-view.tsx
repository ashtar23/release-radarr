import { ListSection } from "@/components/list-section";
import { ScreenPrompt } from "@/components/screen-prompt";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { SignInLinkRow } from "@/components/sign-in-link-row";
import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";
import { CenteredRequestErrorState } from "@/components/centered-request-error-state";

import type { NotificationsSettingsScreenNonReadyState } from "../screen-state";

type NotificationsSettingsStateViewProps = {
  state: NotificationsSettingsScreenNonReadyState;
};

export function NotificationsSettingsStateView({
  state,
}: NotificationsSettingsStateViewProps) {
  if (state.mode === "checking-session") {
    return (
      <CenteredLoadingState
        title="Checking your session..."
        description="Loading your notification settings access."
      />
    );
  }

  if (state.mode === "signed-out") {
    return (
      <ScreenScrollView>
        <ScreenPrompt
          icon={{ ios: "bell.badge", android: "notifications" }}
          title="Control your alerts"
          description="Sign in to manage how notification updates are delivered."
          actionContent={
            <ListSection>
              <SignInLinkRow />
            </ListSection>
          }
        />
      </ScreenScrollView>
    );
  }

  if (state.mode === "config-error") {
    return (
      <CenteredConfigErrorState
        title="Notification settings are unavailable"
        description={state.errorMessage}
        helpText="Check the Supabase environment configuration for this build."
      />
    );
  }

  if (state.mode === "loading") {
    return (
      <CenteredLoadingState
        title="Getting notification preferences"
        description="Loading your saved notification settings."
      />
    );
  }

  return (
    <CenteredRequestErrorState
      title="Notification settings unavailable"
      description={state.errorMessage}
      onRetry={state.onRetry}
      retrying={state.retrying}
    />
  );
}
