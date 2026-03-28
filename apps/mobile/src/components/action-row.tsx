import type { ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  type PressableProps,
  type PressableStateCallbackType,
} from "react-native";
import { useTheme } from "@/hooks/use-theme";

export type ActionRowProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
};

/**
 * A tappable row wrapper for non-navigation actions.
 *
 * Compose this around a `ListRow` when the row should trigger behavior such as
 * sign out, opening a sheet, or toggling a preference without routing away.
 */
export function ActionRow({
  children,
  style,
  ...rest
}: ActionRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      android_ripple={{
        color: theme.interactive.press.androidRipple,
        borderless: false,
        foreground: true,
      }}
      style={(state: PressableStateCallbackType) => [
        styles.root,
        typeof style === "function" ? style(state) : style,
        state.pressed &&
          Platform.OS === "ios" && {
            backgroundColor: theme.interactive.press.iosRowBackground,
          },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
  },
});
