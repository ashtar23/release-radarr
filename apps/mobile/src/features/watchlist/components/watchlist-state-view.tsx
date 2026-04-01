import { ActivityIndicator } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";
import { ListSection } from "@/components/list-section";
import { ScreenPrompt } from "@/components/screen-prompt";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { SignInLinkRow } from "@/components/sign-in-link-row";
import { useTheme } from "@/hooks/use-theme";
import { LinkRow } from "@/components/link-row";
import { ListRow } from "@/components/list-row";

import type { WatchlistScreenMode } from "../hooks/use-watchlist-feature";

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
      <CenteredStateFrame>
        <EmptyState
          title="Checking your session..."
          description="Loading your watchlist access."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  if (mode === "signed-out") {
    return (
      <ScreenScrollView>
        <ScreenPrompt
          icon={{ ios: "bookmark", android: "bookmarks" }}
          title="Build your watchlist"
          description="Sign in to save games here and keep your watchlist synced across devices."
          actionContent={
            <ListSection>
              <SignInLinkRow />
            </ListSection>
          }
        />
      </ScreenScrollView>
    );
  }

  if (mode === "refreshing") {
    return <CenteredStateFrame />;
  }

  if (mode === "loading") {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Loading watchlist..."
          description="Pulling your saved games from the server."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  if (hasSearchQuery) {
    const trimmedSearchQuery = searchQuery?.trim() ?? "";

    return (
      <CenteredStateFrame>
        <EmptyState
          title="No matches in your watchlist"
          description={`Try a different title name than "${trimmedSearchQuery}".`}
          action={
            <ListSection>
              <LinkRow
                href={{
                  pathname: "/search",
                  params: { query: trimmedSearchQuery },
                }}
              >
                <ListRow
                  tone="accent"
                  label={`Search for "${trimmedSearchQuery}"`}
                  leadingIcon={
                    <AppSymbol
                      ios="magnifyingglass"
                      android="search"
                      tintColor={theme.interactive.linkPrimary}
                    />
                  }
                />
              </LinkRow>
            </ListSection>
          }
        />
      </CenteredStateFrame>
    );
  }

  return (
    <CenteredStateFrame>
      <EmptyState
        title="Your watchlist is empty"
        description="Add games from title details to see them here."
      />
    </CenteredStateFrame>
  );
}
