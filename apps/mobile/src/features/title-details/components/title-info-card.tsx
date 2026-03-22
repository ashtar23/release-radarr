import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { TitleDetails } from "@repo/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import {
  formatList,
  formatReleaseDate,
  toReleaseMetaLine,
} from "../utils/title-details-format";
import { PlatformBadgeRow } from "./platform-badge-row";

type TitleInfoCardProps = {
  details: TitleDetails;
};

export function TitleInfoCard({ details }: TitleInfoCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <CardContent details={details} />
    </View>
  );
}

type CardContentProps = {
  details: TitleDetails;
};

function CardContent({ details }: CardContentProps) {
  const insets = useSafeAreaInsets();
  const description = details.description?.trim()
    ? details.description
    : "No description available.";

  return (
    <View
      style={[
        styles.content,
        {
          paddingBottom:
            Platform.OS === "android"
              ? Math.max(Spacing.three, insets.bottom + Spacing.two)
              : Spacing.one,
        },
      ]}
    >
      <View style={styles.heading}>
        <ThemedText type="subtitle">{details.name}</ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {toReleaseMetaLine({
            releaseDate: details.earliestReleaseDate,
            platformCount: details.platforms.length,
          })}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatReleaseDate(details.earliestReleaseDate)}
        </ThemedText>
      </View>

      <PlatformBadgeRow platforms={details.platforms} />

      <ContentBlock label="Description" value={description} />
      <ContentBlock label="Genres" value={formatList(details.genres)} />
      <ContentBlock label="Developers" value={formatList(details.developers)} />
      <ContentBlock label="Publishers" value={formatList(details.publishers)} />

      <View style={styles.block}>
        <ThemedText type="smallBold">Platform Releases</ThemedText>
        {details.releases.length ? (
          <View style={styles.releaseList}>
            {details.releases.map((release) => (
              <ThemedText key={release.platformId} themeColor="textSecondary">
                {release.platformName}: {formatReleaseDate(release.releaseDate)}
              </ThemedText>
            ))}
          </View>
        ) : (
          <ThemedText themeColor="textSecondary">
            No platform-specific releases available.
          </ThemedText>
        )}
      </View>
    </View>
  );
}

type ContentBlockProps = {
  label: string;
  value: string;
};

function ContentBlock({ label, value }: ContentBlockProps) {
  return (
    <View style={styles.block}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText themeColor="textSecondary">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  heading: {
    gap: Spacing.one,
  },
  block: {
    gap: Spacing.one,
  },
  releaseList: {
    gap: Spacing.one,
  },
});
