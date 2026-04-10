import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Stack } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import type { TitleSummary } from "@repo/types";

import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredEmptyState } from "@/components/centered-empty-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";
import { CenteredOfflineState } from "@/components/centered-offline-state";
import { CenteredRequestErrorState } from "@/components/centered-request-error-state";
import { OfflineBanner } from "@/components/offline-banner";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { TitleCardRow } from "@/features/titles/components/title-card-row";
import { useIsOffline } from "@/lib/react-query-online";

import {
  HOME_DISCOVERY_SECTION_META,
  type HomeDiscoverySectionKey,
} from "../home-discovery-sections";
import { useHomeDiscoverySectionInfiniteQuery } from "../queries/use-home-discovery-section-infinite-query";
import { HomeDiscoveryPageFooter } from "./home-discovery-page-footer";

type HomeDiscoveryPageScreenProps = {
  section: HomeDiscoverySectionKey;
};

export function HomeDiscoveryPageScreen({
  section,
}: HomeDiscoveryPageScreenProps) {
  const isOffline = useIsOffline();
  const state = useHomeDiscoverySectionInfiniteQuery(section);
  const meta = HOME_DISCOVERY_SECTION_META[section];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TitleSummary>) => (
      <TitleCardRow result={item} />
    ),
    [],
  );
  const keyExtractor = useCallback((item: TitleSummary) => item.id, []);

  if (isOffline && !state.hasAnyItems) {
    return (
      <>
        <Stack.Screen options={{ title: meta.title }} />
        <CenteredOfflineState
          description={`Reconnect to load ${meta.title.toLowerCase()}.`}
          onRetry={state.refetchSection}
          retrying={state.isFetchingAny}
        />
      </>
    );
  }

  if (state.configError) {
    return (
      <>
        <Stack.Screen options={{ title: meta.title }} />
        <CenteredConfigErrorState
          title={`${meta.title} is unavailable`}
          description={state.configError}
          helpText="Check the API client environment configuration for this build."
        />
      </>
    );
  }

  if (state.isFetchingInitial) {
    return (
      <>
        <Stack.Screen options={{ title: meta.title }} />
        <CenteredLoadingState
          title={`Loading ${meta.title.toLowerCase()}...`}
          description="Pulling more discovery titles."
        />
      </>
    );
  }

  if (state.hasInitialError) {
    return (
      <>
        <Stack.Screen options={{ title: meta.title }} />
        <CenteredRequestErrorState
          title={`Couldn't load ${meta.title.toLowerCase()}`}
          description={state.initialErrorMessage ?? "Something went wrong."}
          onRetry={state.refetchSection}
          retrying={state.isFetchingAny}
        />
      </>
    );
  }

  if (!state.hasAnyItems) {
    return (
      <>
        <Stack.Screen options={{ title: meta.title }} />
        <CenteredEmptyState
          title={meta.emptyTitle}
          description={meta.emptyDescription}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: meta.title }} />
      <FlashList
        style={styles.list}
        data={state.items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        maintainVisibleContentPosition={{ disabled: true }}
        contentInsetAdjustmentBehavior={
          capabilities.autoContentInsets ? "automatic" : "never"
        }
        automaticallyAdjustKeyboardInsets={capabilities.automaticKeyboardInsets}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          isOffline ? (
            <OfflineBanner
              message="You’re offline. Showing the last loaded titles."
              style={styles.offlineBanner}
            />
          ) : (
            <View style={styles.headerSpacer} />
          )
        }
        ItemSeparatorComponent={ItemSeparator}
        ListFooterComponent={
          <HomeDiscoveryPageFooter
            hasMoreResults={state.hasMoreResults}
            loadedCount={state.items.length}
            isLoadingMore={state.isLoadingMore}
            loadMoreErrorMessage={state.loadMoreErrorMessage}
            onRetryLoadMore={state.loadMoreResults}
          />
        }
        onEndReached={state.loadMoreResults}
        onEndReachedThreshold={0.5}
        drawDistance={320}
      />
    </>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerSpacer: {
    height: Spacing.one,
  },
  offlineBanner: {
    marginBottom: Spacing.one,
  },
  separator: {
    height: Spacing.two,
  },
});
