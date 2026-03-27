import React, { useCallback } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";

import type { TitleSummary } from "@repo/types";
import { StyleSheet, View } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";

import { SearchResultsFooter } from "./search-results.footer";
import { SearchResultsHeader } from "./search-results-header";
import { TitleCardRow } from "@/features/titles/components/title-card-row";
import type { SearchScreenState } from "../hooks/use-search-screen-state";

interface SearchResultsListProps {
  searchState: Pick<
    SearchScreenState,
    | "results"
    | "servedBy"
    | "decisionReason"
    | "showSourceBadge"
    | "hasMoreResults"
    | "isLoadingMore"
    | "loadMoreErrorMessage"
  >;
  onRetryLoadMore: () => void;
  onEndReached: () => void;
}

export function SearchResultsList({
  searchState,
  onRetryLoadMore,
  onEndReached,
}: SearchResultsListProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TitleSummary>) => (
      <TitleCardRow result={item} />
    ),
    [],
  );
  const keyExtractor = useCallback((item: TitleSummary) => item.id, []);

  return (
    <FlashList
      style={styles.list}
      data={searchState.results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      maintainVisibleContentPosition={{ disabled: true }}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      automaticallyAdjustKeyboardInsets={capabilities.automaticKeyboardInsets}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={
        capabilities.interactiveKeyboardDismiss ? "interactive" : "on-drag"
      }
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <SearchResultsHeader
          servedBy={searchState.servedBy}
          decisionReason={searchState.decisionReason}
          showSourceBadge={searchState.showSourceBadge}
        />
      }
      ItemSeparatorComponent={ResultSeparator}
      ListFooterComponent={
        <SearchResultsFooter
          hasMoreResults={searchState.hasMoreResults}
          loadedCount={searchState.results.length}
          isLoadingMore={searchState.isLoadingMore}
          loadMoreErrorMessage={searchState.loadMoreErrorMessage}
          onRetryLoadMore={onRetryLoadMore}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      drawDistance={320}
    />
  );
}

function ResultSeparator() {
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
  separator: {
    height: Spacing.two,
  },
});
