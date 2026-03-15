import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { capabilities } from "@/constants/capabilities";
import { useTheme } from "@/hooks/use-theme";

export function ProfileHeaderButton() {
  const theme = useTheme();
  const symbolSize =
    Platform.OS === "android" || !capabilities.liquidGlass ? 28 : 20;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile menu"
      hitSlop={8}
      onPress={() => {}}
      style={styles.button}
    >
      <AppSymbol
        ios="person.crop.circle"
        android="account_circle"
        size={symbolSize}
        tintColor={theme.textSecondary}
        style={capabilities.liquidGlass ? styles.liquidGlassIcon : undefined}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liquidGlassIcon: {
    transform: [{ scale: 1.4 }],
  },
});
