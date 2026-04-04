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
        description="Reconnect to load upcoming, latest, and popular games."
        onRetry={retry}
        retrying={retrying}
      />
    );
  }

  return (
    state.mode !== "ready" ? (
      <HomeStateView state={state} />
    ) : (
      <ScreenScrollView contentContainerStyle={styles.content}>
        {isOffline ? (
          <OfflineBanner
            message="You’re offline. Showing the last loaded discovery sections."
            style={styles.offlineBanner}
          />
        ) : null}

        <View style={styles.header}>
          <ThemedText themeColor="textSecondary">
            Browse what&apos;s releasing soon, what just launched, and what&apos;s
            popular right now.
          </ThemedText>
        </View>

        <HomeDiscoverySection
          title="Upcoming games"
          items={state.discovery.upcoming}
        />
        <HomeDiscoverySection
          title="Latest releases"
          items={state.discovery.latest}
        />
        <HomeDiscoverySection
          title="Popular now"
          items={state.discovery.popular}
        />
      </ScreenScrollView>
    )
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
