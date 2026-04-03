import type {
  TitleDetails,
  WatchlistListResult,
  WatchlistSort,
} from "@repo/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import {
  addWatchlistItem,
  removeWatchlistItem,
  watchlistConfigError,
} from "../data-access/watchlist";
import { DEFAULT_WATCHLIST_SORT } from "../watchlist-sort";
import {
  buildOptimisticWatchlistItem,
  getWatchlistSnapshot,
  removeWatchlistItemByTitleId,
  setWatchlistSnapshot,
  upsertWatchlistItem,
} from "../queries/watchlist-cache";
import {
  getWatchlistQueryKey,
  getWatchlistQueryScope,
} from "../queries/watchlist-query-key";

type AddToWatchlistVariables = {
  title: TitleDetails;
};

type RemoveFromWatchlistVariables = {
  titleId: string;
};

type WatchlistMutationContext = {
  previousWatchlist?: WatchlistListResult;
};

export function useWatchlistMutation(sort: WatchlistSort = DEFAULT_WATCHLIST_SORT) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const watchlistQueryKey = getWatchlistQueryKey(userId, sort);

  const invalidateWatchlist = () => {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: getWatchlistQueryScope(userId),
    });
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
      const previousWatchlist = getWatchlistSnapshot(queryClient, userId, sort);

      const optimisticItem = buildOptimisticWatchlistItem(userId, title);

      setWatchlistSnapshot(queryClient, userId, sort, {
        items: upsertWatchlistItem(
          previousWatchlist?.items ?? [],
          optimisticItem,
          sort,
        ),
      });

      return { previousWatchlist };
    },
    onError: (_error, _variables, context) => {
      if (!userId) {
        return;
      }

      if (context?.previousWatchlist) {
        setWatchlistSnapshot(
          queryClient,
          userId,
          sort,
          context.previousWatchlist,
        );
      }
    },
    onSuccess: (payload) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData<WatchlistListResult>(
        watchlistQueryKey,
        (current) =>
          current
            ? {
                items: upsertWatchlistItem(current.items, payload.item, sort),
              }
            : { items: upsertWatchlistItem([], payload.item, sort) },
      );
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
      const previousWatchlist = getWatchlistSnapshot(queryClient, userId, sort);

      setWatchlistSnapshot(queryClient, userId, sort, {
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
        setWatchlistSnapshot(
          queryClient,
          userId,
          sort,
          context.previousWatchlist,
        );
      }
    },
    onSettled: invalidateWatchlist,
  });

  return {
    addMutation,
    removeMutation,
  };
}
