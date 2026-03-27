import { useRouter } from "expo-router";

import { WatchlistList } from "@/features/watchlist/components/watchlist-list";
import { WatchlistStateView } from "@/features/watchlist/components/watchlist-state-view";
import { useWatchlistFeature } from "@/features/watchlist/hooks/use-watchlist-feature";

export default function WatchlistScreen() {
  const router = useRouter();
  const watchlistFeature = useWatchlistFeature();

  if (watchlistFeature.items.length > 0) {
    return (
      <WatchlistList
        items={watchlistFeature.items}
        refreshing={watchlistFeature.refreshing}
        onRefresh={watchlistFeature.onRefresh}
      />
    );
  }

  return (
    <WatchlistStateView
      mode={watchlistFeature.mode}
      onSignIn={() => router.push("/profile")}
    />
  );
}
