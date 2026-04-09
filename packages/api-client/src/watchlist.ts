import type {
  AddWatchlistItemInput,
  ListWatchlistInput,
  RemoveWatchlistItemInput,
} from "@repo/types";

import type {
  WatchlistListResponse,
  WatchlistMembershipResponse,
  WatchlistUpsertResponse,
} from "./openapi-types";
import {
  openApiDelete,
  openApiGet,
  openApiPost,
} from "./openapi-client";
import type { RequestContext } from "./request";

export interface ListWatchlistParams extends ListWatchlistInput {
  readonly signal?: AbortSignal;
}

export interface GetWatchlistMembershipParams {
  readonly titleId: string;
  readonly signal?: AbortSignal;
}

export interface AddWatchlistItemParams extends AddWatchlistItemInput {
  readonly signal?: AbortSignal;
}

export interface RemoveWatchlistItemParams extends RemoveWatchlistItemInput {
  readonly signal?: AbortSignal;
}

interface ListWatchlistRequestParams {
  readonly context: RequestContext;
  readonly params?: ListWatchlistParams;
}

interface GetWatchlistMembershipRequestParams {
  readonly context: RequestContext;
  readonly params: GetWatchlistMembershipParams;
}

interface AddWatchlistItemRequestParams {
  readonly context: RequestContext;
  readonly params: AddWatchlistItemParams;
}

interface RemoveWatchlistItemRequestParams {
  readonly context: RequestContext;
  readonly params: RemoveWatchlistItemParams;
}

export function listWatchlist({
  context,
  params,
}: ListWatchlistRequestParams): Promise<WatchlistListResponse> {
  return openApiGet({
    context,
    path: "/watchlist",
    query: {
      ...(params?.sort ? { sort: params.sort } : {}),
      ...(typeof params?.query === "string" && params.query.trim()
        ? { query: params.query.trim() }
        : {}),
      ...(typeof params?.cursor === "string" && params.cursor.trim()
        ? { cursor: params.cursor.trim() }
        : {}),
      ...(typeof params?.limit === "number" &&
      Number.isInteger(params.limit) &&
      params.limit > 0
        ? { limit: String(params.limit) }
        : {}),
    },
    signal: params?.signal,
    failureMessage: "Watchlist request failed.",
  });
}

export function getWatchlistMembership({
  context,
  params,
}: GetWatchlistMembershipRequestParams): Promise<WatchlistMembershipResponse> {
  const normalizedTitleId = params.titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  return openApiGet({
    context,
    path: "/watchlist/{titleId}",
    pathParams: {
      titleId: normalizedTitleId,
    },
    signal: params.signal,
    failureMessage: "Watchlist membership request failed.",
  });
}

export function addWatchlistItem({
  context,
  params,
}: AddWatchlistItemRequestParams): Promise<WatchlistUpsertResponse> {
  const normalizedTitleId = params.titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  return openApiPost({
    context,
    path: "/watchlist",
    body: { titleId: normalizedTitleId },
    signal: params.signal,
    failureMessage: "Add watchlist request failed.",
  });
}

export async function removeWatchlistItem({
  context,
  params,
}: RemoveWatchlistItemRequestParams): Promise<void> {
  const normalizedTitleId = params.titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  await openApiDelete({
    context,
    path: "/watchlist/{titleId}",
    pathParams: {
      titleId: normalizedTitleId,
    },
    signal: params.signal,
    failureMessage: "Remove watchlist request failed.",
  });
}
