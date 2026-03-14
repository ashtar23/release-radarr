import React from "react";
import { Link } from "expo-router";
import type { TitleSummary } from "@repo/types";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { formatPlatforms, formatReleaseDate } from "../utils/format-title";

interface SearchResultsListProps {
  results: TitleSummary[];
}

export function SearchResultsList({ results }: SearchResultsListProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={styles.scrollView}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      automaticallyAdjustKeyboardInsets={capabilities.automaticKeyboardInsets}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={
        capabilities.interactiveKeyboardDismiss ? "interactive" : "on-drag"
      }
    >
      <ThemedView style={styles.panel}>
        <View style={styles.searchResultsList}>
          {results.map((result) => (
            <Link
              key={result.id}
              href={{
                pathname: "/titles/[titleId]",
                params: { titleId: result.id, titleName: result.name },
              }}
              asChild
            >
              <Pressable onPress={Keyboard.dismiss}>
                <ThemedView
                  type="background"
                  style={[
                    styles.searchResultItem,
                    { borderColor: theme.textSecondary },
                  ]}
                >
                  <ThemedText type="smallBold">{result.name}</ThemedText>
                  <ThemedText themeColor="textSecondary">
                    {formatReleaseDate(result.earliestReleaseDate)}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    Platforms: {formatPlatforms(result)}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.three,
  },
  panel: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  searchResultsList: {
    gap: Spacing.two,
  },
  searchResultItem: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
});
