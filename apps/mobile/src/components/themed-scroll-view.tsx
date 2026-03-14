import { ScrollView, type ScrollViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedScrollView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedScrollViewProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const resolvedColor =
    lightColor != null && darkColor != null
      ? colorScheme === "dark"
        ? darkColor
        : lightColor
      : theme[type ?? "background"];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[{ backgroundColor: resolvedColor }, style]}
      {...otherProps}
    />
  );
}
