import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
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

import { Spacing, isDarkTheme } from "@/constants/theme";
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
      selectionColor,
      cursorColor,
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
    const darkTheme = isDarkTheme(theme);
    const control = theme.control.input;
    const glassTintColor = isFocused
      ? theme.glassInput.tintFocused
      : theme.glassInput.tintIdle;
    const glassBackgroundColor = isFocused
      ? theme.glassInput.bgFocused
      : theme.glassInput.bgIdle;
    const defaultFocusAccentColor = darkTheme
      ? "rgba(236,236,240,0.92)"
      : "rgba(48,52,56,0.86)";

    useEffect(() => {
      if (!__DEV__ || Platform.OS !== "ios") return;

      let disposed = false;
      const glassApiAvailable = isGlassEffectAPIAvailable();
      const liquidGlassAvailable = isLiquidGlassAvailable();

      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((reduceTransparencyEnabled) => {
          if (disposed) return;

          console.log("[AppInput][glass-debug]", {
            glassApiAvailable,
            liquidGlassAvailable,
            reduceTransparencyEnabled,
            useGlass,
            shouldUseGlass,
          });
        })
        .catch((error) => {
          if (disposed) return;
          console.log("[AppInput][glass-debug] failed to read accessibility state", error);
        });

      return () => {
        disposed = true;
      };
    }, [shouldUseGlass, useGlass]);

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
      ? theme.input.fallbackBorderError
      : isFocused
        ? theme.input.fallbackBorderFocused
        : theme.input.fallbackBorder;

    const glassBorderColor = hasError
      ? theme.glassInput.borderError
      : isFocused
        ? theme.glassInput.borderFocused
        : theme.glassInput.borderIdle;

    const containerStyles = [
      styles.container,
      // Platform.OS === "android" && !shouldUseGlass
      //   ? isFocused
      //     ? theme.input.androidShadowFocused
      //     : theme.input.androidShadow
      //   : null,
      {
        borderColor: shouldUseGlass ? glassBorderColor : fallbackBorderColor,
        borderWidth: shouldUseGlass ? 0 : Platform.OS === "android" ? 0 : 1,
        backgroundColor: shouldUseGlass
          ? glassBackgroundColor
          : theme.background,
        borderRadius: theme.control.radius.lg,
        minHeight: control.height,
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
          placeholderTextColor={placeholderTextColor ?? theme.input.placeholder}
          selectionColor={selectionColor ?? defaultFocusAccentColor}
          cursorColor={cursorColor ?? defaultFocusAccentColor}
          style={[
            styles.input,
            {
              color: theme.text,
              minHeight: control.textMinHeight,
              fontSize: control.textSize,
              lineHeight: control.textLineHeight,
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
            style={[
              styles.clearButton,
              {
                borderColor: theme.input.fallbackBorder,
                width: control.clearButtonSize,
                height: control.clearButtonSize,
                borderRadius: control.clearButtonRadius,
              },
            ]}
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
            colorScheme={darkTheme ? "dark" : "light"}
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
          <ThemedText style={{ color: theme.status.error }}>
            {errorMessage}
          </ThemedText>
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
    overflow: "hidden",
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
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
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  clearButton: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.two,
  },
});
