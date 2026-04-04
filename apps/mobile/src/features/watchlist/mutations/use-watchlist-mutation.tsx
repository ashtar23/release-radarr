import type { TitleDetails } from "@repo/types";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import {
  addWatchlistItem,
  removeWatchlistItem,
  watchlistConfigError,
} from "../data-access/watchlist";
import {
  buildOptimisticWatchlistItem,
  getWatchlistMembershipSnapshot,
  removeWatchlistItemFromInfiniteData,
  restoreWatchlistListQueries,
  setWatchlistMembershipSnapshot,
  snapshotWatchlistListQueries,
  type WatchlistInfiniteData,
  updateWatchlistListQueries,
  upsertWatchlistItemInInfiniteData,
} from "../queries/watchlist-cache";
import { getWatchlistListQueryScope } from "../queries/watchlist-query-key";

type AddToWatchlistVariables = {
  title: TitleDetails;
};

type RemoveFromWatchlistVariables = {
  titleId: string;
};

type WatchlistQuerySnapshot = readonly [
  QueryKey,
  WatchlistInfiniteData | undefined,
];

type WatchlistMutationContext = {
  previousWatchlists?: readonly WatchlistQuerySnapshot[];
  previousMembership?: { isInWatchlist: boolean };
};

export function useWatchlistMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const invalidateWatchlist = () => {
    if (!userId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: getWatchlistListQueryScope(userId),
    });
  };

  const createWatchlistMutationContext = async (
    titleId: string,
  ): Promise<WatchlistMutationContext> => {
    if (!userId) {
      return {};
    }

    await queryClient.cancelQueries({
      queryKey: getWatchlistListQueryScope(userId),
    });

    return {
      previousWatchlists: snapshotWatchlistListQueries(queryClient, userId),
      previousMembership: getWatchlistMembershipSnapshot(
        queryClient,
        userId,
        titleId,
      ),
    };
  };

  const restoreWatchlistMutationContext = (
    titleId: string,
    context: WatchlistMutationContext | undefined,
  ) => {
    if (!userId) {
      return;
    }

    if (context?.previousWatchlists) {
      restoreWatchlistListQueries(queryClient, context.previousWatchlists);
    }

    if (context?.previousMembership) {
      setWatchlistMembershipSnapshot(
        queryClient,
        userId,
        titleId,
        context.previousMembership.isInWatchlist,
      );
    }
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

      const context = await createWatchlistMutationContext(title.id);

      const optimisticItem = buildOptimisticWatchlistItem(userId, title);
      updateWatchlistListQueries(queryClient, userId, ({ sort, current }) =>
        upsertWatchlistItemInInfiniteData(current, optimisticItem, sort),
      );
      setWatchlistMembershipSnapshot(queryClient, userId, title.id, true);

      return context;
    },
    onError: (_error, variables, context) => {
      restoreWatchlistMutationContext(variables.title.id, context);
    },
    onSuccess: (payload) => {
      if (!userId) {
        return;
      }

      updateWatchlistListQueries(queryClient, userId, ({ sort, current }) =>
        upsertWatchlistItemInInfiniteData(current, payload.item, sort),
      );
      setWatchlistMembershipSnapshot(
        queryClient,
        userId,
        payload.item.title.id,
        true,
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

      const context = await createWatchlistMutationContext(titleId);

      updateWatchlistListQueries(queryClient, userId, ({ current }) =>
        removeWatchlistItemFromInfiniteData(current, titleId),
      );
      setWatchlistMembershipSnapshot(queryClient, userId, titleId, false);

      return context;
    },
    onError: (_error, variables, context) => {
      restoreWatchlistMutationContext(variables.titleId, context);
    },
    onSuccess: (_payload, variables) => {
      if (!userId) {
        return;
      }

      setWatchlistMembershipSnapshot(
        queryClient,
        userId,
        variables.titleId,
        false,
      );
    },
    onSettled: invalidateWatchlist,
  });

  return {
    addMutation,
    removeMutation,
  };
}
