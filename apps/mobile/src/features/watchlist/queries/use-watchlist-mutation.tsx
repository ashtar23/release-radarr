import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TitleDetails, WatchlistListResult } from "@repo/types";
import {
  addWatchlistItem,
  removeWatchlistItem,
  watchlistConfigError,
} from "../data-access/watchlist";
import { useAuth } from "@/auth/auth-provider";
import {
  buildOptimisticWatchlistItem,
  getWatchlistSnapshot,
  removeWatchlistItemByTitleId,
  setWatchlistSnapshot,
  upsertWatchlistItem,
} from "./watchlist-cache";
import { getWatchlistQueryKey } from "./watchlist-query-key";

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
  const watchlistQueryKey = getWatchlistQueryKey(userId);
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
      const previousWatchlist = getWatchlistSnapshot(queryClient, userId);

      const optimisticItem = buildOptimisticWatchlistItem(userId, title);

      setWatchlistSnapshot(queryClient, userId, {
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
        setWatchlistSnapshot(queryClient, userId, context.previousWatchlist);
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
      const previousWatchlist = getWatchlistSnapshot(queryClient, userId);

      setWatchlistSnapshot(queryClient, userId, {
        items: removeWatchlistItemByTitleId(
          previousWatchlist?.items ?? [],
          titleId,
        ),
      });

      return { previousWatchlist };
    },
    onError: (_error, _variables, context) => {
      if (!userId) {
        return;
      }

      if (context?.previousWatchlist) {
        setWatchlistSnapshot(queryClient, userId, context.previousWatchlist);
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
