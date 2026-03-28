import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClientConfigError } from "@/lib/api-client";

import { useHomeDiscoveryQuery } from "../data-access/use-home-discovery-query";
import { HomeDiscoverySection } from "./home-discovery-section";

export function HomeScreenContent() {
  const theme = useTheme();
  const discoveryQuery = useHomeDiscoveryQuery();
  const errorTextStyle = { color: theme.status.error };
  const hasAnySection =
    (discoveryQuery.data?.upcoming.length ?? 0) > 0 ||
    (discoveryQuery.data?.latest.length ?? 0) > 0 ||
    (discoveryQuery.data?.popular.length ?? 0) > 0;

  return (
    <ScrollView
      style={styles.scrollView}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        {/* <ThemedText type="title">Discover</ThemedText> */}
        <ThemedText themeColor="textSecondary">
          Browse what&apos;s releasing soon, what just launched, and what&apos;s
          popular right now.
        </ThemedText>
      </View>

      {apiClientConfigError ? (
        <ThemedText style={[styles.message, errorTextStyle]}>
          {apiClientConfigError}
        </ThemedText>
      ) : null}

      {discoveryQuery.isPending ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">
            Loading discovery...
          </ThemedText>
        </View>
      ) : null}

      {discoveryQuery.isError ? (
        <ThemedText style={[styles.message, errorTextStyle]}>
          {discoveryQuery.error instanceof Error
            ? discoveryQuery.error.message
            : "Something went wrong while loading discovery."}
        </ThemedText>
      ) : null}

      {discoveryQuery.data ? (
        <>
          <HomeDiscoverySection
            title="Upcoming games"
            items={discoveryQuery.data.upcoming}
          />
          <HomeDiscoverySection
            title="Latest releases"
            items={discoveryQuery.data.latest}
          />
          <HomeDiscoverySection
            title="Popular now"
            items={discoveryQuery.data.popular}
          />
        </>
      ) : null}

      {discoveryQuery.data && !hasAnySection ? (
        <ThemedText themeColor="textSecondary" style={styles.message}>
          No discovery titles are available right now.
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  header: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  loadingRow: {
    paddingHorizontal: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  message: {
    paddingHorizontal: Spacing.three,
  },
});
