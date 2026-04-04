import { AppSymbol } from "@/components/app-symbol";
import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";
import { CenteredEmptyState } from "@/components/centered-empty-state";
import { CenteredRequestErrorState } from "@/components/centered-request-error-state";
import { ListSection } from "@/components/list-section";
import { ScreenPrompt } from "@/components/screen-prompt";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { SignInLinkRow } from "@/components/sign-in-link-row";
import { useTheme } from "@/hooks/use-theme";
import { LinkRow } from "@/components/link-row";
import { ListRow } from "@/components/list-row";

import type { WatchlistScreenNonReadyState } from "../screen-state";

type WatchlistStateViewProps = {
  state: WatchlistScreenNonReadyState;
};

export function WatchlistStateView({ state }: WatchlistStateViewProps) {
  const theme = useTheme();

  if (state.mode === "signed-out") {
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

  if (state.mode === "config-error") {
    return (
      <CenteredConfigErrorState
        title="Watchlist is unavailable"
        description={state.errorMessage}
        helpText="Check the Supabase environment configuration for this build."
      />
    );
  }

  if (state.mode === "loading") {
    return (
      <CenteredLoadingState
        title="Loading watchlist..."
        description="Pulling your saved games from the server."
      />
    );
  }

  if (state.mode === "request-error") {
    return (
      <CenteredRequestErrorState
        title="Couldn't load watchlist"
        description={state.errorMessage}
        onRetry={state.onRetry}
        retrying={state.retrying}
      />
    );
  }

  if (state.mode === "search-empty") {
    return (
      <CenteredEmptyState
        title="No matches in your watchlist"
        description={`Try a different title name than "${state.searchQuery}".`}
        action={
          <ListSection>
            <LinkRow
              href={{
                pathname: "/search",
                params: { query: state.searchQuery },
              }}
            >
              <ListRow
                tone="accent"
                label={`Search for "${state.searchQuery}"`}
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
    );
  }

  return (
    <CenteredEmptyState
      title="Your watchlist is empty"
      description="Add games from title details to see them here."
    />
  );
}
