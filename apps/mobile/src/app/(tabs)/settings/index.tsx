import React from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

export default function SettingsScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      {Array.from({ length: 50 }, (_, index) => (
        <ThemedText key={index}>Settings</ThemedText>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
});
