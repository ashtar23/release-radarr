import React from "react";

import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useAuth } from "@/auth/auth-provider";

import { AccountSignedIn } from "./account-signed-in";
import { AccountSignedOut } from "./account-signed-out";
import { AccountStateView } from "./account-state-view";

export function AccountScreen() {
  const { user, isReady, configError } = useAuth();

  const canSubmit = isReady && !configError;

  if (!isReady) {
    return <AccountStateView mode="loading" />;
  }

  if (configError) {
    return <AccountStateView mode="config-error" errorMessage={configError} />;
  }

  return (
    <ScreenScrollView>
      {user ? (
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
