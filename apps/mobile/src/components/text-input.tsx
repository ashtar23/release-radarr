import React, { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextInputProps = Omit<
  RNTextInputProps,
  "style" | "placeholderTextColor" | "selectionColor" | "cursorColor"
> & {
  errorMessage?: string;
  disabled?: boolean;
  leadingSlot?: ReactNode;
  trailingSlot?: ReactNode;
  allowPasswordToggle?: boolean;
};

/**
 * TextInput is the grouped-surface input primitive for the mobile app.
 *
 * It relies on the surrounding surface for most of its chrome, which keeps it
 * visually aligned with list sections and auth forms.
 */
export function TextInput({
  errorMessage,
  disabled = false,
  leadingSlot,
  trailingSlot,
  allowPasswordToggle = false,
  secureTextEntry = false,
  editable,
  onChangeText,
  value,
  defaultValue,
  placeholder,
  ...textInputProps
}: TextInputProps) {
  const theme = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    value ?? defaultValue ?? "",
  );
  const inputRef = React.useRef<RNTextInput>(null);

  const isEditable = !disabled && editable !== false;
  const canTogglePassword = secureTextEntry && allowPasswordToggle;
  const resolvedSecureTextEntry = canTogglePassword
    ? !isPasswordVisible
    : secureTextEntry;
  const resolvedValue = value ?? uncontrolledValue;

  React.useEffect(() => {
    if (value !== undefined) {
      setUncontrolledValue(value);
    }
  }, [value]);

  const handlePasswordToggle = React.useCallback(() => {
    setIsPasswordVisible((current) => !current);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleChangeText = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue);
      }

      onChangeText?.(nextValue);
    },
    [onChangeText, value],
  );

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
        size={20}
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

        <RNTextInput
          ref={inputRef}
          editable={isEditable}
          secureTextEntry={resolvedSecureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={theme.input.placeholder}
          selectionColor={theme.interactive.linkPrimary}
          cursorColor={theme.interactive.linkPrimary}
          onChangeText={handleChangeText}
          value={resolvedValue}
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
    padding: Spacing.three,
    gap: Spacing.half,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: Spacing.one,
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  slotButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: 13,
  },
});
