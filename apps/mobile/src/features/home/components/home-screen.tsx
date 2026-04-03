import React from "react";
import { StyleSheet, View } from "react-native";

import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

import { useHomeScreen } from "../hooks/use-home-screen";
import { HomeDiscoverySection } from "./home-discovery-section";
import { HomeStateView } from "./home-state-view";

export function HomeScreen() {
  const { state } = useHomeScreen();

  if (state.mode !== "ready") {
    return <HomeStateView state={state} />;
  }

  const { discovery } = state;

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText themeColor="textSecondary">
          Browse what&apos;s releasing soon, what just launched, and what&apos;s
          popular right now.
        </ThemedText>
      </View>

      <HomeDiscoverySection title="Upcoming games" items={discovery.upcoming} />
      <HomeDiscoverySection title="Latest releases" items={discovery.latest} />
      <HomeDiscoverySection title="Popular now" items={discovery.popular} />
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
});
