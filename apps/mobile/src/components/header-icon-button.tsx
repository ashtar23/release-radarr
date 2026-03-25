import type { ComponentProps } from "react";
import { Pressable, type PressableProps } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { useTheme } from "@/hooks/use-theme";

type AppSymbolProps = Omit<ComponentProps<typeof AppSymbol>, "tintColor">;

type HeaderIconButtonProps = Omit<PressableProps, "children"> & {
  iconProps: AppSymbolProps;
  tintColor?: string;
};

/**
 * A header button component that displays an icon and handles press events.
 *
 * @param {HeaderIconButtonProps} props - The props for the HeaderIconButton component.
 * @param {AppSymbolProps} props.iconProps - The props to pass to the AppSymbol component, including the icon name and size.
 * @param {PressableProps} [props.pressableProps] - Additional props to pass to the Pressable component, such as onPress and accessibilityLabel.
 * @param {number} [props.hitSlop=8] - The amount of additional space around the button that can be pressed to trigger the onPress event.
 * @param {string} [props.accessibilityRole="button"] - The accessibility role for the button, defaulting to "button".
 * @returns {JSX.Element} The rendered HeaderIconButton component.
 *
 * @example
 * <HeaderIconButton
 *   onPress={() => console.log("Button pressed")}
 *   accessibilityLabel="Add to watchlist"
 *   iconProps={{ ios: "bookmark", android: "bookmark_add" }}
 * />
 */
export function HeaderIconButton({
  iconProps,
  tintColor,
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
      <AppSymbol
        size={20}
        tintColor={tintColor ?? theme.textSecondary}
        {...iconProps}
      />
    </Pressable>
  );
}
