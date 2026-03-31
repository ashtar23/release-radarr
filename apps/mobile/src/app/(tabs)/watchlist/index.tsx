import { WatchlistList } from "@/features/watchlist/components/watchlist-list";
import { WatchlistStateView } from "@/features/watchlist/components/watchlist-state-view";
import { useWatchlistFeature } from "@/features/watchlist/hooks/use-watchlist-feature";

export default function WatchlistScreen() {
  const watchlistFeature = useWatchlistFeature();

  return (
    <>
      {watchlistFeature.items.length > 0 ? (
        <WatchlistList
          items={watchlistFeature.items}
          refreshing={watchlistFeature.refreshing}
          onRefresh={watchlistFeature.onRefresh}
        />
      ) : (
        <WatchlistStateView mode={watchlistFeature.mode} />
      )}
    </>
  );
}
