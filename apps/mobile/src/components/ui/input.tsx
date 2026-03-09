import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
  type StyleProp,
  View,
} from "react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { ThemedText } from "../themed-text";

export type AppInputProps = TextInputProps & {
  errorMessage?: string;
  disabled?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  useGlass?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

type InputFocusEvent = Parameters<NonNullable<TextInputProps["onFocus"]>>[0];
type InputBlurEvent = Parameters<NonNullable<TextInputProps["onBlur"]>>[0];

function canUseGlassEffect() {
  if (Platform.OS !== "ios") return false;

  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

export const AppInput = forwardRef<TextInput, AppInputProps>(
  (
    {
      errorMessage,
      disabled = false,
      leftSlot,
      rightSlot,
      clearable = false,
      onClear,
      useGlass = true,
      containerStyle,
      inputStyle,
      editable,
      onFocus,
      onBlur,
      onChangeText,
      placeholderTextColor,
      value,
      style,
      ...textInputProps
    },
    ref,
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const isEditable = !disabled && editable !== false;
    const shouldUseGlass = useGlass && canUseGlassEffect();
    const hasError = Boolean(errorMessage);
    const hasValue = typeof value === "string" && value.length > 0;
    const isDarkTheme = theme.background === "#000000";
    const glassTintColor = isDarkTheme
      ? "rgba(255,255,255,0.1)"
      : isFocused
        ? "rgba(252,253,255,0.88)"
        : "rgba(215,222,232,0.56)";
    const glassBackgroundColor = isDarkTheme
      ? "transparent"
      : isFocused
        ? "rgba(231,237,246,0.28)"
        : "rgba(210,217,227,0.16)";

    useImperativeHandle(ref, () => inputRef.current as TextInput, []);

    const handleFocus = (event: InputFocusEvent) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    const handleBlur = (event: InputBlurEvent) => {
      setIsFocused(false);
      onBlur?.(event);
    };

    const handleClear = () => {
      onClear?.();
      if (!onClear) onChangeText?.("");
    };

    const fallbackBorderColor = hasError
      ? "#b42318"
      : isFocused
        ? theme.text
        : theme.textSecondary;

    const glassBorderColor = hasError
      ? "rgba(180,35,24,0.75)"
      : isFocused
        ? isDarkTheme
          ? "rgba(255,255,255,0.3)"
          : "rgba(0,0,0,0.24)"
        : isDarkTheme
          ? "rgba(255,255,255,0.14)"
          : "rgba(0,0,0,0.12)";

    const containerStyles = [
      styles.container,
      Platform.OS === "android" && !shouldUseGlass
        ? isFocused
          ? styles.androidShadowFocused
          : styles.androidShadow
        : null,
      {
        borderColor: shouldUseGlass ? glassBorderColor : fallbackBorderColor,
        borderWidth: shouldUseGlass ? 0 : Platform.OS === "android" ? 0 : 1,
        backgroundColor: shouldUseGlass
          ? glassBackgroundColor
          : theme.background,
      },
      disabled && styles.containerDisabled,
      containerStyle,
    ];

    const field = (
      <>
        {leftSlot ? <View style={styles.slot}>{leftSlot}</View> : null}

        <TextInput
          ref={inputRef}
          value={value}
          editable={isEditable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={onChangeText}
          placeholderTextColor={placeholderTextColor ?? theme.textSecondary}
          style={[
            styles.input,
            {
              color: theme.text,
            },
            inputStyle,
            style,
          ]}
          {...textInputProps}
        />

        {clearable && hasValue && isEditable ? (
          <Pressable
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
            hitSlop={8}
            style={[styles.clearButton, { borderColor: theme.textSecondary }]}
          >
            <ThemedText type="smallBold">×</ThemedText>
          </Pressable>
        ) : null}

        {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
      </>
    );

    return (
      <View style={styles.root}>
        {shouldUseGlass ? (
          <GlassView
            style={containerStyles}
            colorScheme={isDarkTheme ? "dark" : "light"}
            tintColor={glassTintColor}
            isInteractive={isEditable}
            glassEffectStyle={{
              style: isFocused || hasError ? "regular" : "clear",
              animate: true,
              animationDuration: 0.2,
            }}
          >
            {field}
          </GlassView>
        ) : (
          <View style={containerStyles}>{field}</View>
        )}

        {errorMessage ? (
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}
      </View>
    );
  },
);

AppInput.displayName = "AppInput";

const styles = StyleSheet.create({
  root: {
    gap: Spacing.one,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
    minHeight: 44,
  },
  androidShadow: {
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  androidShadowFocused: {
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  containerDisabled: {
    opacity: 0.55,
  },
  slot: {
    marginRight: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 20,
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.two,
  },
  errorText: {
    color: "#b42318",
  },
});
