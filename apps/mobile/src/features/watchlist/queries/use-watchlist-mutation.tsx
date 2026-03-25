import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TitleDetails, WatchlistListResult } from "@repo/types";
import {
  addWatchlistItem,
  removeWatchlistItem,
  watchlistConfigError,
} from "../data-access/watchlist";
import { useAuth } from "@/auth/auth-provider";

type AddToWatchlistVariables = {
  title: TitleDetails;
};

type RemoveFromWatchlistVariables = {
  titleId: string;
};

type WatchlistMutationContext = {
  previousWatchlist?: WatchlistListResult;
};

function useWatchlistMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const watchlistQueryKey = ["watchlist", userId] as const;
  const invalidateWatchlist = () => {
    if (!userId) {
      return;
    }

    queryClient
      .invalidateQueries({ queryKey: watchlistQueryKey })
      .catch(() => {});
  };

  const addMutation = useMutation({
    mutationFn: async ({ title }: AddToWatchlistVariables) => {
      if (watchlistConfigError) {
        throw new Error(watchlistConfigError);
      }

      return addWatchlistItem({ titleId: title.id });
    },
    onMutate: async ({ title }): Promise<WatchlistMutationContext> => {
      if (!userId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: watchlistQueryKey });
      const previousWatchlist =
        queryClient.getQueryData<WatchlistListResult>(watchlistQueryKey);

      const optimisticItem = {
        id: `${userId}:${title.id}`,
        title,
        releases: title.releases,
        addedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<WatchlistListResult>(watchlistQueryKey, {
        items: upsertWatchlistItem(
          previousWatchlist?.items ?? [],
          optimisticItem,
        ),
      });

      return { previousWatchlist };
    },
    onError: (_error, _variables, context) => {
      if (!userId) {
        return;
      }

      if (context?.previousWatchlist) {
        queryClient.setQueryData(watchlistQueryKey, context.previousWatchlist);
      }
    },
    onSuccess: (payload) => {
      if (!userId) return;

      queryClient.setQueryData<WatchlistListResult>(
        watchlistQueryKey,
        (current) =>
          current
            ? {
                items: upsertWatchlistItem(current.items, payload.item),
              }
            : { items: [payload.item] },
      );
      invalidateWatchlist();
    },
    onSettled: invalidateWatchlist,
  });

  const removeMutation = useMutation({
    mutationFn: async ({ titleId }: RemoveFromWatchlistVariables) => {
      if (watchlistConfigError) {
        throw new Error(watchlistConfigError);
      }

      return removeWatchlistItem({ titleId });
    },
    onMutate: async ({ titleId }): Promise<WatchlistMutationContext> => {
      if (!userId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: watchlistQueryKey });
      const previousWatchlist =
        queryClient.getQueryData<WatchlistListResult>(watchlistQueryKey);

      queryClient.setQueryData<WatchlistListResult>(watchlistQueryKey, {
        items: (previousWatchlist?.items ?? []).filter(
          (item) => item.title.id !== titleId,
        ),
      });

      return { previousWatchlist };
    },
    onError: (_error, _variables, context) => {
      if (!userId) {
        return;
      }

      if (context?.previousWatchlist) {
        queryClient.setQueryData(watchlistQueryKey, context.previousWatchlist);
      }
    },
    onSuccess: () => {
      if (!userId) return;

      invalidateWatchlist();
    },
    onSettled: invalidateWatchlist,
  });

  return {
    addMutation,
    removeMutation,
  };
}

export { useWatchlistMutation };

function upsertWatchlistItem(
  items: WatchlistListResult["items"],
  item: WatchlistListResult["items"][number],
) {
  const filteredItems = items.filter(
    (existingItem) => existingItem.id !== item.id,
  );
  return [item, ...filteredItems];
}
