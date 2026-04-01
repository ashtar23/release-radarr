import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/theme";

type CenteredStateFrameProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CenteredStateFrame({
  children,
  style,
}: CenteredStateFrameProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Spacing.three,
  },
});
