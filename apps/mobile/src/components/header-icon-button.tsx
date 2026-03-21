import type { ComponentProps } from "react";
import { Pressable, type PressableProps } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { useTheme } from "@/hooks/use-theme";

type AppSymbolProps = ComponentProps<typeof AppSymbol>;

type HeaderIconButtonProps = Omit<PressableProps, "children"> & {
  iconProps: AppSymbolProps;
};

export function HeaderIconButton({
  iconProps,
  hitSlop = 8,
  accessibilityRole = "button",
  ...pressableProps
}: HeaderIconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop}
      {...pressableProps}
    >
      <AppSymbol size={20} tintColor={theme.textSecondary} {...iconProps} />
    </Pressable>
  );
}
