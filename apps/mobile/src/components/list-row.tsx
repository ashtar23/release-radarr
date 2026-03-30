import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  LIST_ROW_PADDING_HORIZONTAL,
  LIST_ROW_PADDING_VERTICAL,
} from "@/components/list-tokens";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type BaseListRowProps = {
  /**
   * The tone of the row, which applies platform-appropriate styling to indicate
   * the nature of the row. "accent" is used for primary actions, "destructive"
   * is used for destructive actions, and "default" is used for neutral rows.
   * Note that tone is only applied to the label text, and not to any leading or
   * trailing icons or custom children.
   */
  tone?: "default" | "accent" | "destructive";
  /**
   * An optional icon to display at the start of the row
   */
  leadingIcon?: ReactNode;
  /**
   * An optional icon to display at the end of the row
   */
  trailingIcon?: ReactNode;
  /**
   * Additional styles to apply to the row container
   */
  style?: ViewStyle;
};

/**
 * Standard text-based list row content.
 *
 * Use this shape for the common settings/list case where the row renders a
 * primary `label`, an optional `subtitle`, and optional leading/trailing
 * icons.
 */
type ListRowLabelProps = BaseListRowProps & {
  /**
   * Primary row text. This is the main visible title for the row.
   */
  label: string;
  /**
   * Optional secondary text rendered below the label.
   */
  subtitle?: string;
  /**
   * Prevents mixing text props with fully custom row content.
   */
  children?: never;
};

/**
 * Fully custom list row content.
 *
 * Use this shape when the row body should be rendered manually instead of
 * using the built-in label/subtitle layout.
 */
type ListRowChildrenProps = BaseListRowProps & {
  /**
   * Custom row content rendered as-is inside the standard row container.
   */
  children: ReactNode;
  /**
   * Prevents mixing custom row content with the built-in label layout.
   */
  label?: never;
  /**
   * Prevents mixing custom row content with the built-in subtitle layout.
   */
  subtitle?: never;
};

/**
 * Supported prop shapes for `ListRow`.
 *
 * Either provide `label`/`subtitle` for the standard text layout, or provide
 * `children` for a fully custom row body.
 */
export type ListRowProps = ListRowLabelProps | ListRowChildrenProps;

/**
 * A presentational list row that renders label, subtitle, and optional leading
 * or trailing content using the platform list styling for the app.
 *
 * This component is intentionally non-interactive. Wrap it with `LinkRow` for
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
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
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
    paddingHorizontal: LIST_ROW_PADDING_HORIZONTAL,
    paddingVertical: LIST_ROW_PADDING_VERTICAL,
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
