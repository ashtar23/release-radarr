import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const iosRadius = capabilities.liquidGlass ? 22 : 10;
const androidRadius = capabilities.expressiveShape ? 16 : 12;

function androidItemRadius(isFirst: boolean, isLast: boolean) {
  const r = androidRadius;
  return {
    borderTopLeftRadius: isFirst ? r : 0,
    borderTopRightRadius: isFirst ? r : 0,
    borderBottomLeftRadius: isLast ? r : 0,
    borderBottomRightRadius: isLast ? r : 0,
  };
}

export function ListSection({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? theme.backgroundElement : theme.background;

  const childArray = React.Children.toArray(children);
  const last = childArray.length - 1;

  if (Platform.OS === "android") {
    return (
      <View style={styles.androidContainer}>
        {childArray.map((child, index) => (
          <View
            key={index}
            style={[
              styles.androidItem,
              androidItemRadius(index === 0, index === last),
              { backgroundColor: bg },
            ]}
          >
            {child}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.iosSection, { backgroundColor: bg }]}>
      {childArray.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <View
              style={[styles.separator, { backgroundColor: theme.separator }]}
            />
          )}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iosSection: {
    borderRadius: iosRadius,
    overflow: "hidden",
  },
  androidContainer: {
    gap: 3,
  },
  androidItem: {
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
