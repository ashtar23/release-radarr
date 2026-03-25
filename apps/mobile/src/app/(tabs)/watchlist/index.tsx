import { useRouter } from "expo-router";

import { WatchlistList } from "@/features/watchlist/components/watchlist-list";
import { WatchlistStateView } from "@/features/watchlist/components/watchlist-state-view";
import { useWatchlistScreenState } from "@/features/watchlist/hooks/use-watchlist-screen-state";

export default function WatchlistScreen() {
  const router = useRouter();
  const watchlistScreenState = useWatchlistScreenState();

  if (watchlistScreenState.items.length > 0) {
    return (
      <WatchlistList
        items={watchlistScreenState.items}
        refreshing={watchlistScreenState.refreshing}
        onRefresh={watchlistScreenState.onRefresh}
      />
    );
  }

  return (
    <WatchlistStateView
      mode={watchlistScreenState.mode}
      onSignIn={() => router.push("/profile")}
    />
  );
}
