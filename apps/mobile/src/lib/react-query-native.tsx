import { focusManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

function handleAppStateChange(status: AppStateStatus) {
  if (Platform.OS === "web") {
    return;
  }

  focusManager.setFocused(status === "active");
}

export function ReactQueryNativeLifecycle() {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
