import type { ReactNode } from "react";
import {
  Platform,
  Pressable,
  View,
  type PressableProps,
  type PressableStateCallbackType,
} from "react-native";

import { ListRow } from "./list-row";
import { useTheme } from "@/hooks/use-theme";

export type PressableRowProps = Omit<PressableProps, "children"> & {
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
};

export function PressableRow({
  label,
  leadingIcon,
  trailingIcon,
  children,
  style,
  ...rest
}: PressableRowProps) {
  const theme = useTheme();

  const content =
    children != null ? (
      children
    ) : label !== undefined ? (
      <ListRow
        label={label}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
      />
    ) : null;

  return (
    <Pressable
      android_ripple={{ color: theme.backgroundSelected, borderless: false }}
      {...rest}
    >
      {(state: PressableStateCallbackType) => (
        <View
          style={[
            typeof style === "function" ? style(state) : style,
            state.pressed &&
              Platform.OS === "ios" && {
                backgroundColor: theme.backgroundSelected,
              },
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}
