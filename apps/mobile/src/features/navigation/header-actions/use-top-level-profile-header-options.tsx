import React from "react";
import { Platform } from "react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

import { ProfileHeaderButton } from "@/components/profile-header-button";

type UseTopLevelProfileHeaderOptionsParams = {
  /** Hides the profile action for routes like settings or account-related flows. */
  hidden?: boolean;
};

/**
 * Returns the top-level profile header placement for mobile tab screens.
 *
 * On iOS the profile affordance lives on the left.
 * On Android it stays on the right due to the title being left-aligned.
 *
 * @Platform iOS and Android
 *
 */
export function useTopLevelProfileHeaderOptions(
  params: UseTopLevelProfileHeaderOptionsParams = {},
): Pick<NativeStackNavigationOptions, "headerLeft" | "headerRight"> {
  const { hidden = false } = params;

  if (hidden) {
    return {
      headerLeft: undefined,
      headerRight: undefined,
    };
  }

  if (Platform.OS === "ios") {
    return {
      headerLeft: () => <ProfileHeaderButton />,
      headerRight: undefined,
    };
  }

  return {
    headerLeft: undefined,
    headerRight: () => <ProfileHeaderButton />,
  };
}
