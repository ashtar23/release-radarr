import React from "react";
import { StyleSheet } from "react-native";

import { CenteredOfflineState } from "@/components/centered-offline-state";
import { OfflineBanner } from "@/components/offline-banner";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { Spacing } from "@/constants/theme";
import { useProtectedOfflineRetry } from "@/lib/offline-screen";
import { useIsOffline } from "@/lib/react-query-online";

import { useAccountScreen } from "../hooks/use-account-screen";
import { AccountSignedIn } from "./account-signed-in";
import { AccountSignedOut } from "./account-signed-out";
import { AccountStateView } from "./account-state-view";

export function AccountScreen() {
  const isOffline = useIsOffline();
  const { state } = useAccountScreen();
  const offlineRetry = useProtectedOfflineRetry();

  if (isOffline && state.mode !== "ready") {
    return (
      <CenteredOfflineState
        description="Reconnect to check your session and manage your account."
        onRetry={offlineRetry.onRetry}
        retrying={offlineRetry.retrying}
      />
    );
  }

  return state.mode === "checking-session" || state.mode === "config-error" ? (
    <AccountStateView state={state} />
  ) : (
    <ScreenScrollView>
      {isOffline ? (
        <OfflineBanner
          message="You’re offline. Showing locally available account information."
          style={styles.offlineBanner}
        />
      ) : null}

      {state.mode === "ready" ? (
        <AccountSignedIn canSubmit={state.canSubmit} email={state.email} />
      ) : (
        <AccountSignedOut />
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    marginBottom: Spacing.one,
  },
});
