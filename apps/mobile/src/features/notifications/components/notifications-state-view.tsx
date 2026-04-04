import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredEmptyState } from "@/components/centered-empty-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";
import { CenteredRequestErrorState } from "@/components/centered-request-error-state";
import { ListSection } from "@/components/list-section";
import { ScreenPrompt } from "@/components/screen-prompt";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { SignInLinkRow } from "@/components/sign-in-link-row";

import type { NotificationsScreenNonReadyState } from "../screen-state";

type NotificationsStateViewProps = {
  state: NotificationsScreenNonReadyState;
};

export function NotificationsStateView({ state }: NotificationsStateViewProps) {
  if (state.mode === "config-error") {
    return (
      <CenteredConfigErrorState
        title="Notifications are unavailable"
        description={state.errorMessage}
        helpText="Check the Supabase environment configuration for this build."
      />
    );
  }

  if (state.mode === "signed-out") {
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

  if (state.mode === "request-error") {
    return (
      <CenteredRequestErrorState
        title="Couldn't load notifications"
        description={state.errorMessage}
        onRetry={state.onRetry}
        retrying={state.retrying}
      />
    );
  }

  if (state.mode === "loading") {
    return (
      <CenteredLoadingState
        title="Loading notifications..."
        description="Pulling the latest updates for your watchlist."
      />
    );
  }

  return (
    <CenteredEmptyState
      title="No notifications yet"
      description="We'll send you updates about your watchlist here."
    />
  );
}
