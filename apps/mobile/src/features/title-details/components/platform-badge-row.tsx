import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type PlatformBadgeRowProps = {
  platforms: { name: string }[];
};

export function PlatformBadgeRow({ platforms }: PlatformBadgeRowProps) {
  const labels = platforms.length
    ? platforms.map((platform) => platform.name)
    : ["Unknown"];

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <PlatformBadge key={`${label}-${index}`} label={label} />
      ))}
    </View>
  );
}

type PlatformBadgeProps = {
  label: string;
};

function PlatformBadge({ label }: PlatformBadgeProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.badgeRoot,
        styles.badgeSolid,
        {
          backgroundColor: theme.background,
          borderColor: theme.separator,
        },
      ]}
    >
      <ThemedText type="small" style={styles.badgeText}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  badgeRoot: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
  },
  badgeSolid: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  badgeText: {
    lineHeight: 18,
  },
});
