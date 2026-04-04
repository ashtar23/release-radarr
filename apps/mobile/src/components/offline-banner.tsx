import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  ANDROID_LIST_SECTION_RADIUS,
  IOS_LIST_SECTION_RADIUS,
  LIST_ROW_PADDING_HORIZONTAL,
  LIST_ROW_PADDING_VERTICAL,
} from "@/components/list-tokens";
import { Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

import { AppSymbol } from "./app-symbol";
import { ThemedText } from "./themed-text";

type OfflineBannerProps = {
  message: string;
  style?: StyleProp<ViewStyle>;
};

export function OfflineBanner({ message, style }: OfflineBannerProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const backgroundColor = isDark ? theme.backgroundElement : theme.background;
  const borderRadius =
    Platform.OS === "ios"
      ? IOS_LIST_SECTION_RADIUS
      : ANDROID_LIST_SECTION_RADIUS;

  return (
    <View style={style}>
      <View
        style={[
          styles.surface,
          {
            backgroundColor,
            borderColor: theme.separator,
            borderRadius,
          },
        ]}
      >
        <AppSymbol
          ios="wifi.slash"
          android="signal_wifi_off"
          size={16}
          tintColor={theme.status.warning}
        />
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.message}
        >
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: LIST_ROW_PADDING_HORIZONTAL,
    paddingVertical: LIST_ROW_PADDING_VERTICAL,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: {
    flex: 1,
  },
});
