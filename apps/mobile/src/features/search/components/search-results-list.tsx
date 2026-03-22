import React, { useCallback } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";

import type { TitleSummary } from "@repo/types";
import { StyleSheet, View } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";

import { SearchResultsFooter } from "./search-results.footer";
import { SearchResultsHeader } from "./search-results-header";
import { SearchResultRow } from "./search-result-row";

interface SearchResultsListProps {
  results: TitleSummary[];
  query: string;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  onEndReached: () => void;
}

export function SearchResultsList({
  results,
  query,
  hasMoreResults,
  isLoadingMore,
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
      ListHeaderComponent={
        <SearchResultsHeader query={query} resultCount={results.length} />
      }
      ListFooterComponent={
        <SearchResultsFooter
          hasMoreResults={hasMoreResults}
          isLoadingMore={isLoadingMore}
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
