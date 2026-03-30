import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { IOS_LIST_SECTION_RADIUS } from "@/components/list-tokens";
import { ThemedText } from "@/components/themed-text";
import { Spacing, isDarkTheme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Visual tone for the button's text, fill, and feedback states.
 */
type ButtonTone = "accent" | "neutral" | "danger";

/**
 * Props for the app's grouped-surface button primitive.
 *
 * `Button` is meant for clear, centered call-to-action rows that still feel at
 * home inside our list and form surfaces.
 */
export type ButtonProps = Omit<
  PressableProps,
  "children" | "style" | "disabled"
> & {
  /** Visible button label. */
  label: string;
  /** Shows a spinner and disables presses while work is in progress. */
  loading?: boolean;
  /** Disables interaction and dims the button. */
  disabled?: boolean;
  /** Controls the button's visual emphasis and semantic color. */
  tone?: ButtonTone;
  /** Optional icon shown before the label. */
  leadingIcon?: ReactNode;
  /** Optional icon shown after the label. */
  trailingIcon?: ReactNode;
  /** Additional container styles applied to the pressable surface. */
  style?: StyleProp<ViewStyle>;
};

function hexToRgb(hex: string) {
  const normalizedHex = hex.replace("#", "");
  const expandedHex =
    normalizedHex.length === 3
      ? normalizedHex
          .split("")
          .map((char) => char + char)
          .join("")
      : normalizedHex;

  const value = Number.parseInt(expandedHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

/**
 * Applies an alpha channel to a hex theme token so we can derive soft fills
 * and interaction colors from the same base hue.
 */
function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Renders a tone-aware button with native press feedback, optional icons, and
 * built-in loading handling.
 */
export function Button({
  label,
  loading = false,
  disabled = false,
  tone = "neutral",
  leadingIcon,
  trailingIcon,
  style,
  android_ripple,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const darkTheme = isDarkTheme(theme);
  const borderRadius =
    Platform.OS === "ios"
      ? IOS_LIST_SECTION_RADIUS
      : theme.control.radius.md;

  const toneColor =
    tone === "accent"
      ? theme.interactive.linkPrimary
      : tone === "danger"
        ? theme.status.error
        : theme.text;

  const backgroundColor =
    tone === "accent"
      ? withAlpha(theme.interactive.linkPrimary, darkTheme ? 0.2 : 0.18)
      : tone === "danger"
        ? withAlpha(theme.status.error, darkTheme ? 0.24 : 0.14)
        : darkTheme
          ? theme.backgroundElement
          : withAlpha(theme.text, 0.06);

  const pressedBackgroundColor =
    tone === "accent"
      ? withAlpha(theme.interactive.linkPrimary, darkTheme ? 0.28 : 0.26)
      : tone === "danger"
        ? withAlpha(theme.status.error, darkTheme ? 0.28 : 0.3)
        : withAlpha(theme.text, 0.16);

  const rippleColor =
    android_ripple?.color ??
    (tone === "accent"
      ? withAlpha(theme.interactive.linkPrimary, 0.18)
      : tone === "danger"
        ? withAlpha(theme.status.error, 0.22)
        : theme.interactive.press.androidRipple);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      android_ripple={{
        color: rippleColor,
        borderless: false,
        foreground: true,
        ...android_ripple,
      }}
      style={({ pressed }) => [
        styles.root,
        {
          minHeight: theme.control.input.height,
          borderRadius,
          backgroundColor:
            pressed && Platform.OS === "ios" && !isDisabled
              ? pressedBackgroundColor
              : backgroundColor,
        },
        isDisabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      <View style={styles.content}>
        {loading ? (
          <View style={styles.iconLeading}>
            <ActivityIndicator size="small" color={toneColor} />
          </View>
        ) : leadingIcon ? (
          <View style={styles.iconLeading}>{leadingIcon}</View>
        ) : null}

        <ThemedText style={[styles.label, { color: toneColor }]}>
          {label}
        </ThemedText>

        {trailingIcon ? (
          <View style={styles.iconTrailing}>{trailingIcon}</View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  label: {
    textAlign: "center",
  },
  iconLeading: {
    marginRight: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTrailing: {
    marginLeft: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.55,
  },
});
