import React from "react";

import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useAuthGate } from "@/auth/use-auth-gate";

import { AccountSignedIn } from "./account-signed-in";
import { AccountSignedOut } from "./account-signed-out";
import { AccountStateView } from "./account-state-view";

export function AccountScreen() {
  const { state, user, configError, isSignedIn } = useAuthGate();

  const canSubmit = state === "ready" && !configError;

  if (state === "checking-session") {
    return <AccountStateView mode="loading" />;
  }

  if (state === "config-error") {
    return <AccountStateView mode="config-error" errorMessage={configError} />;
  }

  return (
    <ScreenScrollView>
      {isSignedIn && user ? (
        <AccountSignedIn
          canSubmit={canSubmit}
          email={user.email}
          onSignedOut={() => {}}
        />
      ) : (
        <AccountSignedOut />
      )}
    </ScreenScrollView>
  );
}
