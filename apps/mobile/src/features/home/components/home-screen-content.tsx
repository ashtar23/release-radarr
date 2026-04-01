import React from "react";
import { StyleSheet, View } from "react-native";

import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { apiClientConfigError } from "@/lib/api-client";

import { useHomeDiscoveryQuery } from "../data-access/use-home-discovery-query";
import { HomeDiscoverySection } from "./home-discovery-section";
import { HomeStateView } from "./home-state-view";

export function HomeScreenContent() {
  const discoveryQuery = useHomeDiscoveryQuery();
  const hasAnySection =
    (discoveryQuery.data?.upcoming.length ?? 0) > 0 ||
    (discoveryQuery.data?.latest.length ?? 0) > 0 ||
    (discoveryQuery.data?.popular.length ?? 0) > 0;

  if (apiClientConfigError) {
    return (
      <HomeStateView mode="config-error" errorMessage={apiClientConfigError} />
    );
  }

  if (discoveryQuery.isPending) {
    return <HomeStateView mode="loading" />;
  }

  if (discoveryQuery.isError) {
    return (
      <HomeStateView
        mode="request-error"
        errorMessage={
          discoveryQuery.error instanceof Error
            ? discoveryQuery.error.message
            : "Something went wrong while loading discovery."
        }
        onRetry={() => {
          void discoveryQuery.refetch();
        }}
        retrying={discoveryQuery.isRefetching}
      />
    );
  }

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText themeColor="textSecondary">
          Browse what&apos;s releasing soon, what just launched, and what&apos;s
          popular right now.
        </ThemedText>
      </View>

      {discoveryQuery.data && hasAnySection ? (
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
  message: {
    paddingHorizontal: Spacing.three,
  },
});
