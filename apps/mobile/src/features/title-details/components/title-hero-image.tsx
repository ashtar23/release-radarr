import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { AppSymbol } from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type TitleHeroImageProps = {
  coverImageUrl: string | null;
  title: string;
};

export function TitleHeroImage({ coverImageUrl, title }: TitleHeroImageProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      {coverImageUrl ? (
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.imageFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={220}
          accessibilityLabel={`${title} cover image`}
        />
      ) : (
        <ThemedView type="backgroundSelected" style={styles.fallbackFill}>
          <AppSymbol
            ios="photo"
            android="image"
            size={30}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Cover image unavailable
          </ThemedText>
        </ThemedView>
      )}

      <View pointerEvents="none" style={styles.gradientOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    aspectRatio: 1.18,
    overflow: "hidden",
  },
  imageFill: {
    flex: 1,
    width: "100%",
  },
  fallbackFill: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
    experimental_backgroundImage:
      "linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.74) 100%)",
  },
});
