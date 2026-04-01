import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppSymbol,
  type AndroidSymbolName,
  type IOSSymbolName,
} from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

import { ListSection } from "./list-section";

type ScreenPromptProps = {
  icon: {
    ios: IOSSymbolName;
    android: AndroidSymbolName;
  };
  title: string;
  description: string;
  actionContent?: ReactNode;
};

export function ScreenPrompt({
  icon,
  title,
  description,
  actionContent,
}: ScreenPromptProps) {
  return (
    <>
      <ListSection>
        <View style={styles.sectionIntro}>
          <AppSymbol ios={icon.ios} android={icon.android} size={48} />
          <ThemedText type="title" style={styles.heading}>
            {title}
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle} themeColor="textSecondary">
            {description}
          </ThemedText>
        </View>
      </ListSection>

      {actionContent}
    </>
  );
}

const styles = StyleSheet.create({
  sectionIntro: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionSubtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
  heading: {
    fontSize: 40,
    textAlign: "center",
    lineHeight: 44,
  },
});
