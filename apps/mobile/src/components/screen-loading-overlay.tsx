import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ScreenLoadingOverlayProps = {
  pointerEvents?: ViewProps["pointerEvents"];
  label?: string;
};

export function ScreenLoadingOverlay({
  pointerEvents = "auto",
  label,
}: ScreenLoadingOverlayProps) {
  const theme = useTheme();

  return (
    <View
      pointerEvents={pointerEvents}
      style={[styles.overlay, { backgroundColor: `${theme.background}CC` }]}
    >
      <View style={styles.content}>
        <ActivityIndicator size="small" color={theme.text} />
        {label ? (
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: Spacing.one,
  },
});
