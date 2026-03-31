import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";

import { ThemedText } from "./themed-text";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon != null && <View style={styles.icon}>{icon}</View>}

      <ThemedText type="default" style={styles.title}>
        {title}
      </ThemedText>

      {description != null && (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.description}
        >
          {description}
        </ThemedText>
      )}

      {action != null && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.five,
    gap: Spacing.two,
  },
  icon: {
    marginBottom: Spacing.two,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
  },
  description: {
    textAlign: "center",
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.three,
    width: "100%",
  },
});
