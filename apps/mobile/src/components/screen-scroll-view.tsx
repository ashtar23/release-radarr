import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";

type ScreenScrollViewProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ScreenScrollView({
  children,
  contentContainerStyle,
}: ScreenScrollViewProps) {
  return (
    <ScrollView
      style={styles.scrollView}
      alwaysBounceVertical
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
