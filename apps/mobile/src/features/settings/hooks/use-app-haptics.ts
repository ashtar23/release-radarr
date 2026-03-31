import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { useAppPreferences } from "@/features/settings/providers/app-preferences";

/**
 * Centralized app haptics gate.
 *
 * Route all user-facing haptic feedback through this hook so the global
 * `Haptics` setting is respected consistently across the app.
 */
export function useAppHaptics() {
  const { hapticsEnabled } = useAppPreferences();

  const impact = useCallback(
    (
      style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
    ) => {
      if (!hapticsEnabled) {
        return;
      }

      void Haptics.impactAsync(style).catch(() => {});
    },
    [hapticsEnabled],
  );

  const selection = useCallback(() => {
    if (!hapticsEnabled) {
      return;
    }

    void Haptics.selectionAsync().catch(() => {});
  }, [hapticsEnabled]);

  const notification = useCallback(
    (
      type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
        .Success,
    ) => {
      if (!hapticsEnabled) {
        return;
      }

      void Haptics.notificationAsync(type).catch(() => {});
    },
    [hapticsEnabled],
  );

  return {
    isEnabled: hapticsEnabled,
    impact,
    selection,
    notification,
  };
}
