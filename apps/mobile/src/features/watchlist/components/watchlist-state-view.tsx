import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { SignInLinkRow } from "@/components/sign-in-link-row";
import { EmptyState } from "@/components/empty-state";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import type { WatchlistScreenMode } from "../hooks/use-watchlist-feature";
import { ListSection } from "@/components/list-section";

type WatchlistStateViewProps = {
  mode: WatchlistScreenMode;
  searchQuery?: string;
};

export function WatchlistStateView({
  mode,
  searchQuery,
}: WatchlistStateViewProps) {
  const theme = useTheme();
  const hasSearchQuery = Boolean(searchQuery?.trim());

  if (mode === "checking-session") {
    return (
      <WatchlistStateFrame>
        <EmptyState
          title="Checking your session..."
          description="Loading your watchlist access."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </WatchlistStateFrame>
    );
  }

  if (mode === "signed-out") {
    return (
      <WatchlistStateFrame>
        <EmptyState
          title="Sign in to use your watchlist"
          description="Save games here, then come back anytime from any device."
          action={
            <ListSection>
              <SignInLinkRow />
            </ListSection>
          }
        />
      </WatchlistStateFrame>
    );
  }

  if (mode === "refreshing") {
    return <WatchlistStateFrame />;
  }

  if (mode === "loading") {
    return (
      <WatchlistStateFrame>
        <EmptyState
          title="Loading watchlist..."
          description="Pulling your saved games from the server."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </WatchlistStateFrame>
    );
  }

  if (hasSearchQuery) {
    return (
      <WatchlistStateFrame>
        <EmptyState
          title="No matches in your watchlist"
          description={`Try a different title name than "${searchQuery?.trim()}".`}
        />
      </WatchlistStateFrame>
    );
  }

  return (
    <WatchlistStateFrame>
      <EmptyState
        title="Your watchlist is empty"
        description="Add games from title details to see them here."
      />
    </WatchlistStateFrame>
  );
}

function WatchlistStateFrame({ children }: { children?: ReactNode }) {
  return <View style={styles.emptyState}>{children}</View>;
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingTop: Spacing.three,
  },
});
