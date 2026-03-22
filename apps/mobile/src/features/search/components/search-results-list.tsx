import React, { useCallback } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";

import type { TitleSummary } from "@repo/types";
import { StyleSheet, View } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";

import { SearchResultsFooter } from "./search-results.footer";
import { SearchResultRow } from "./search-result-row";

interface SearchResultsListProps {
  results: TitleSummary[];
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  onRetryLoadMore: () => void;
  onEndReached: () => void;
}

export function SearchResultsList({
  results,
  hasMoreResults,
  isLoadingMore,
  loadMoreErrorMessage,
  onRetryLoadMore,
  onEndReached,
}: SearchResultsListProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TitleSummary>) => (
      <SearchResultRow result={item} />
    ),
    [],
  );
  const keyExtractor = useCallback((item: TitleSummary) => item.id, []);

  return (
    <FlashList
      style={styles.list}
      data={results}
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
      ItemSeparatorComponent={ResultSeparator}
      ListFooterComponent={
        <SearchResultsFooter
          hasMoreResults={hasMoreResults}
          loadedCount={results.length}
          isLoadingMore={isLoadingMore}
          loadMoreErrorMessage={loadMoreErrorMessage}
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
