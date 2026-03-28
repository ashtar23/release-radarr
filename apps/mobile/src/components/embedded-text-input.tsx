import React, { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type EmbeddedTextInputProps = Omit<
  TextInputProps,
  "style" | "placeholderTextColor" | "selectionColor" | "cursorColor"
> & {
  errorMessage?: string;
  disabled?: boolean;
  leadingSlot?: ReactNode;
  trailingSlot?: ReactNode;
  allowPasswordToggle?: boolean;
};

/**
 * A grouped-section text input that relies on the surrounding surface for its
 * container styling instead of rendering standalone input chrome.
 */
export function EmbeddedTextInput({
  errorMessage,
  disabled = false,
  leadingSlot,
  trailingSlot,
  allowPasswordToggle = false,
  secureTextEntry = false,
  editable,
  ...textInputProps
}: EmbeddedTextInputProps) {
  const theme = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const isEditable = !disabled && editable !== false;
  const canTogglePassword = secureTextEntry && allowPasswordToggle;
  const resolvedSecureTextEntry = canTogglePassword
    ? !isPasswordVisible
    : secureTextEntry;

  const handlePasswordToggle = React.useCallback(() => {
    setIsPasswordVisible((current) => !current);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const resolvedTrailingSlot = canTogglePassword ? (
    <Pressable
      onPress={handlePasswordToggle}
      accessibilityRole="button"
      accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
      hitSlop={8}
      style={styles.slotButton}
    >
      <AppSymbol
        ios={isPasswordVisible ? "eye.slash" : "eye"}
        android={isPasswordVisible ? "visibility_off" : "visibility"}
        size={18}
        tintColor={theme.textSecondary}
      />
    </Pressable>
  ) : (
    trailingSlot
  );

  return (
    <View style={styles.root}>
      <View style={styles.fieldRow}>
        {leadingSlot ? <View style={styles.slot}>{leadingSlot}</View> : null}

        <TextInput
          ref={inputRef}
          editable={isEditable}
          secureTextEntry={resolvedSecureTextEntry}
          placeholderTextColor={theme.input.placeholder}
          selectionColor={theme.interactive.linkPrimary}
          cursorColor={theme.interactive.linkPrimary}
          style={[styles.input, { color: theme.text }]}
          {...textInputProps}
        />

        {resolvedTrailingSlot ? (
          <View style={styles.slot}>{resolvedTrailingSlot}</View>
        ) : null}
      </View>

      {errorMessage ? (
        <ThemedText style={[styles.error, { color: theme.status.error }]}>
          {errorMessage}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
  },
  slotButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
});
