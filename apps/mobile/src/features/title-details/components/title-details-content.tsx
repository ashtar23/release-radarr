import React from "react";
import { StyleSheet, View } from "react-native";
import type { TitleDetails } from "@repo/types";

import { Spacing } from "@/constants/theme";

import { TitleHeroImage } from "./title-hero-image";
import { TitleInfoCard } from "./title-info-card";

type TitleDetailsContentProps = {
  details: TitleDetails;
};

export function TitleDetailsContent({ details }: TitleDetailsContentProps) {
  return (
    <View>
      <TitleHeroImage
        title={details.name}
        coverImageUrl={details.coverImageUrl}
      />

      <View style={styles.infoCardContainer}>
        <TitleInfoCard details={details} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
  },
  infoCardContainer: {
    marginTop: -Spacing.four,
    flexGrow: 1,
  },
});
