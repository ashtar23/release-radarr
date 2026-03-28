import React, { useMemo } from "react";
import { useRouter } from "expo-router";

import { WatchlistList } from "@/features/watchlist/components/watchlist-list";
import { WatchlistStateView } from "@/features/watchlist/components/watchlist-state-view";
import { useWatchlistFeature } from "@/features/watchlist/hooks/use-watchlist-feature";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";

export default function WatchlistScreen() {
  const router = useRouter();
  const watchlistFeature = useWatchlistFeature();
  const headerActions = useMemo<HeaderAction[]>(
    () => [
      {
        kind: "menu",
        id: "watchlist-demo-menu",
        label: "Watchlist actions",
        iosIcon: "ellipsis.circle",
        menuTitle: "Watchlist actions",
        visible: watchlistFeature.items.length > 0,
        items: [
          {
            id: "watchlist-demo-sort",
            label: "Sort by release date",
            iosIcon: "arrow.up.arrow.down.circle",

            onPress: () => {},
          },
          {
            id: "watchlist-demo-coming-soon",
            label: "Filter coming soon",
            iosIcon: "line.3.horizontal.decrease.circle",
            onPress: () => {},
          },
        ],
      },
    ],
    [watchlistFeature.items.length],
  );
  return (
    <>
      <HeaderActions actions={headerActions} />

      {watchlistFeature.items.length > 0 ? (
        <WatchlistList
          items={watchlistFeature.items}
          refreshing={watchlistFeature.refreshing}
          onRefresh={watchlistFeature.onRefresh}
        />
      ) : (
        <WatchlistStateView
          mode={watchlistFeature.mode}
          onSignIn={() => router.push("/profile")}
        />
      )}
    </>
  );
}
