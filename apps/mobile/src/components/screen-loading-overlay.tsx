import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";

type ScreenLoadingOverlayProps = {
  pointerEvents?: ViewProps["pointerEvents"];
};

export function ScreenLoadingOverlay({
  pointerEvents = "auto",
}: ScreenLoadingOverlayProps) {
  const theme = useTheme();

  return (
    <View
      pointerEvents={pointerEvents}
      style={[styles.overlay, { backgroundColor: `${theme.background}CC` }]}
    >
      <ActivityIndicator size="small" color={theme.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
