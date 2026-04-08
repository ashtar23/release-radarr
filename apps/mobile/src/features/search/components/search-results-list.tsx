import React, { useCallback, type ReactNode } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";

import type { TitleSummary } from "@repo/types";
import { StyleSheet, View } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";

import { SearchResultsFooter } from "./search-results-footer";
import { SearchResultsHeader } from "./search-results-header";
import { TitleCardRow } from "@/features/titles/components/title-card-row";
import type { SearchScreenReadyState } from "../screen-state";

interface SearchResultsListProps {
  searchState: SearchScreenReadyState;
  onRetryLoadMore: () => void;
  onEndReached: () => void;
  listHeader?: ReactNode;
}

export function SearchResultsList({
  searchState,
  onRetryLoadMore,
  onEndReached,
  listHeader,
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
        <>
          {listHeader}
          <SearchResultsHeader
            servedBy={searchState.servedBy}
            decisionReason={searchState.decisionReason}
            showSourceBadge={searchState.showSourceBadge}
          />
        </>
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
