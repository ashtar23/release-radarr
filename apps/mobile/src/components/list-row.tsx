import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const ROW_PADDING_HORIZONTAL = 16;
const ROW_PADDING_VERTICAL = 14;

type BaseListRowProps = {
  tone?: "default" | "accent" | "destructive";
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  style?: ViewStyle;
};

type ListRowLabelProps = BaseListRowProps & {
  label: string;
  subtitle?: string;
  children?: never;
};

type ListRowChildrenProps = BaseListRowProps & {
  children: ReactNode;
  label?: never;
  subtitle?: never;
};

export type ListRowProps = ListRowLabelProps | ListRowChildrenProps;

/**
 * A presentational list row that renders label, subtitle, and optional leading
 * or trailing content using the platform list styling for the app.
 *
 * This component is intentionally non-interactive. Wrap it with `AppLink` for
 * navigation or `ActionRow` for non-navigation actions when press feedback is
 * needed.
 */
export function ListRow({
  tone = "default",
  label,
  subtitle,
  leadingIcon,
  trailingIcon,
  children,
  style,
}: ListRowProps) {
  const theme = useTheme();

  if (children != null) {
    return <View style={[styles.row, style]}>{children}</View>;
  }

  const labelColor =
    tone === "accent"
      ? theme.interactive.linkPrimary
      : tone === "destructive"
        ? theme.status.error
        : undefined;

  return (
    <View style={[styles.row, style]}>
      {leadingIcon != null ? (
        <View style={styles.leading}>{leadingIcon}</View>
      ) : null}

      <View style={styles.subtitle}>
        <ThemedText
          style={[styles.label, labelColor ? { color: labelColor } : undefined]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>

        {subtitle && (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        )}
      </View>

      {trailingIcon != null ? (
        <View style={styles.trailing}>{trailingIcon}</View>
      ) : null}
    </View>
  );
}

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
  subtitle: {
    flex: 1,
    gap: Spacing.half,
  },
  leading: {
    marginRight: 8,
  },
  trailing: {
    marginLeft: 8,
  },
});
