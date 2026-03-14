import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";

const ROW_PADDING_HORIZONTAL = 16;
const ROW_PADDING_VERTICAL = 14;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ROW_PADDING_HORIZONTAL,
    paddingVertical: ROW_PADDING_VERTICAL,
  },
  label: {
    flex: 1,
  },
  leading: {
    marginRight: 8,
  },
  trailing: {
    marginLeft: 8,
  },
});

export type ListRowProps = {
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
};

export function ListRow({
  label,
  leadingIcon,
  trailingIcon,
  children,
  style,
}: ListRowProps) {
  if (children != null) {
    return <View style={[styles.row, style]}>{children}</View>;
  }

  if (label === undefined) {
    return null;
  }

  return (
    <View style={[styles.row, style]}>
      {leadingIcon != null ? (
        <View style={styles.leading}>{leadingIcon}</View>
      ) : null}
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
      {trailingIcon != null ? (
        <View style={styles.trailing}>{trailingIcon}</View>
      ) : null}
    </View>
  );
}
