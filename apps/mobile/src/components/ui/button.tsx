import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { GlassView } from "expo-glass-effect";

import { capabilities } from "@/constants/capabilities";
import { Spacing, isDarkTheme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ThemedText } from "../themed-text";

export type AppButtonVariant = "primary" | "secondary" | "destructive";

export type AppButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: AppButtonVariant;
  useGlass?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  label,
  loading = false,
  disabled = false,
  variant = "primary",
  useGlass = false,
  style,
  labelStyle,
  android_ripple,
  ...pressableProps
}: AppButtonProps) {
  const theme = useTheme();
  const darkTheme = isDarkTheme(theme);
  const [isPressed, setIsPressed] = React.useState(false);
  const isDisabled = disabled || loading;
  const shouldUseGlass = useGlass && capabilities.glassEffect;
  const glassTintColor = theme.glassInput.tintIdle;
  const glassBackgroundColor = theme.glassInput.bgIdle;
  const glassBorderColor = theme.glassInput.borderIdle;
  const pressedOverlayColor = darkTheme
    ? "rgba(255,255,255,0.10)"
    : "rgba(15,23,42,0.08)";

  const backgroundColor =
    variant === "primary"
      ? darkTheme
        ? "rgba(255,255,255,0.12)"
        : theme.text
      : variant === "destructive"
        ? theme.status.error
        : "transparent";

  const borderColor =
    variant === "primary"
      ? darkTheme
        ? "rgba(255,255,255,0.2)"
        : "transparent"
      : variant === "destructive"
        ? theme.status.error
        : theme.textSecondary;

  const textColor = shouldUseGlass
    ? theme.text
    : variant === "primary"
      ? darkTheme
        ? theme.text
        : theme.background
      : variant === "destructive"
        ? theme.background
        : theme.text;

  const content = (
    <React.Fragment>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={styles.loadingIndicator}
        />
      ) : null}
      <ThemedText type="smallBold" style={[{ color: textColor }, labelStyle]}>
        {label}
      </ThemedText>
    </React.Fragment>
  );

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      android_ripple={
        android_ripple ?? {
          color: pressedOverlayColor,
          borderless: false,
        }
      }
      style={({ pressed }) => [
        styles.root,
        {
          minHeight: theme.control.input.height,
          borderRadius: theme.control.radius.md,
          borderColor: shouldUseGlass ? glassBorderColor : borderColor,
          borderWidth: shouldUseGlass ? 0 : 1,
          backgroundColor: shouldUseGlass
            ? glassBackgroundColor
            : backgroundColor,
        },
        Platform.OS === "ios" &&
          !shouldUseGlass &&
          pressed &&
          !isDisabled && {
            opacity: 0.88,
          },
        isDisabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      {shouldUseGlass ? (
        <GlassView
          style={styles.glassContainer}
          colorScheme={darkTheme ? "dark" : "light"}
          tintColor={glassTintColor}
        >
          <View style={styles.content}>{content}</View>
        </GlassView>
      ) : (
        <View style={styles.content}>{content}</View>
      )}
      {shouldUseGlass && isPressed && !isDisabled ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: theme.control.radius.md,
              backgroundColor: pressedOverlayColor,
            },
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    overflow: "hidden",
  },
  glassContainer: {
    flex: 1,
  },
  content: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  loadingIndicator: {
    marginRight: Spacing.one,
  },
  disabled: {
    opacity: 0.55,
  },
});
