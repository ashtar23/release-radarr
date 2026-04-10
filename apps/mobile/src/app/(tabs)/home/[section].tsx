import { HomeDiscoveryPageScreen } from "@/features/home/components/home-discovery-page-screen";
import {
  isHomeDiscoverySectionKey,
} from "@/features/home/home-discovery-sections";
import { useLocalSearchParams } from "expo-router";
import React from "react";

import { CenteredConfigErrorState } from "@/components/centered-config-error-state";

export default function HomeDiscoverySectionRoute() {
  const { section } = useLocalSearchParams<{ section?: string }>();

  if (!isHomeDiscoverySectionKey(section)) {
    return (
      <CenteredConfigErrorState
        title="Discovery section unavailable"
        description="This discovery section is not supported."
        helpText="Open one of the available rails from the home screen."
      />
    );
  }

  return <HomeDiscoveryPageScreen section={section} />;
}
