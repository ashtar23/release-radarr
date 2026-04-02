import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import {
  ANDROID_LIST_SECTION_RADIUS,
  IOS_LIST_SECTION_RADIUS,
  LIST_ROW_PADDING_HORIZONTAL,
} from "@/components/list-tokens";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

function androidItemRadius(isFirst: boolean, isLast: boolean) {
  const r = ANDROID_LIST_SECTION_RADIUS;
  return {
    borderTopLeftRadius: isFirst ? r : 0,
    borderTopRightRadius: isFirst ? r : 0,
    borderBottomLeftRadius: isLast ? r : 0,
    borderBottomRightRadius: isLast ? r : 0,
  };
}

type ListSectionProps = {
  /**
   * Optional subtle section label rendered above the grouped surface.
   */
  title?: string;
  /**
   * Optional subtle footer rendered below the grouped surface.
   */
  footer?: string;
  /**
   * One or more row items composed inside the grouped section surface.
   */
  children: React.ReactNode;
};

/**
 * Owns the grouped list surface for one or more row items.
 *
 * `ListSection` is responsible for section background, separators, and corner
 * treatment. Compose `ListRow` inside it, then wrap individual rows with
 * `LinkRow` or `ActionRow` when they need interaction.
 */
export function ListSection({ title, footer, children }: ListSectionProps) {
  const theme = useTheme();
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? theme.backgroundElement : theme.background;

  const childArray = React.Children.toArray(children);
  const last = childArray.length - 1;

  const sectionContent =
    Platform.OS === "android" ? (
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
    ) : (
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

  return (
    <View style={styles.root}>
      {title ? (
        <ThemedText
          type="smallBold"
          themeColor="textSecondary"
          style={styles.title}
        >
          {title}
        </ThemedText>
      ) : null}

      {sectionContent}

      {footer ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={styles.footer}
        >
          {footer}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
  title: {
    paddingHorizontal: LIST_ROW_PADDING_HORIZONTAL,
    paddingBottom: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: LIST_ROW_PADDING_HORIZONTAL,
    paddingTop: 10,
    fontSize: 13,
  },
  iosSection: {
    borderRadius: IOS_LIST_SECTION_RADIUS,
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
