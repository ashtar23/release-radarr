import React from "react";
import { StyleSheet, View } from "react-native";

import { CenteredOfflineState } from "@/components/centered-offline-state";
import { OfflineBanner } from "@/components/offline-banner";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useIsOffline } from "@/lib/react-query-online";

import { useHomeScreen } from "../hooks/use-home-screen";
import { HomeDiscoverySection } from "./home-discovery-section";
import { HomeStateView } from "./home-state-view";

export function HomeScreen() {
  const isOffline = useIsOffline();
  const { state, retry, retrying } = useHomeScreen();

  if (isOffline && state.mode !== "ready") {
    return (
      <CenteredOfflineState
        description="Reconnect to load the latest curated discovery rails."
        onRetry={retry}
        retrying={retrying}
      />
    );
  }

  if (state.mode !== "ready") {
    return <HomeStateView state={state} />;
  }

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      {isOffline ? (
        <OfflineBanner
          message="You’re offline. Showing the last loaded discovery sections."
          style={styles.offlineBanner}
        />
      ) : null}

      <View style={styles.header}>
        <ThemedText themeColor="textSecondary">
          Track what&apos;s releasing soon, what just landed, and what&apos;s
          worth keeping an eye on.
        </ThemedText>
      </View>

      <HomeDiscoverySection
        section="upcoming"
        title="Releasing Soon"
        items={state.discovery.upcoming}
      />
      <HomeDiscoverySection
        section="latest"
        title="Recently Released"
        items={state.discovery.latest}
      />
      <HomeDiscoverySection
        section="popular"
        title="Worth Watching"
        items={state.discovery.popular}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    paddingHorizontal: 0,
    paddingBottom: Spacing.five,
  },
  header: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  offlineBanner: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.one,
  },
});
