import React from "react";

import { ScreenScrollView } from "@/components/screen-scroll-view";

import { useAccountScreen } from "../hooks/use-account-screen";
import { AccountSignedIn } from "./account-signed-in";
import { AccountSignedOut } from "./account-signed-out";
import { AccountStateView } from "./account-state-view";

export function AccountScreen() {
  const { state } = useAccountScreen();

  if (state.mode === "checking-session" || state.mode === "config-error") {
    return <AccountStateView state={state} />;
  }

  return (
    <ScreenScrollView>
      {state.mode === "ready" ? (
        <AccountSignedIn canSubmit={state.canSubmit} email={state.email} />
      ) : (
        <AccountSignedOut />
      )}
    </ScreenScrollView>
  );
}
