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
import { requestJson, requestVoid, type RequestContext } from "./request";

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
  const searchParams = new URLSearchParams();
  if (params?.sort) {
    searchParams.set("sort", params.sort);
  }

  if (typeof params?.query === "string" && params.query.trim()) {
    searchParams.set("query", params.query.trim());
  }

  if (typeof params?.cursor === "string" && params.cursor.trim()) {
    searchParams.set("cursor", params.cursor.trim());
  }

  if (
    typeof params?.limit === "number" &&
    Number.isInteger(params.limit) &&
    params.limit > 0
  ) {
    searchParams.set("limit", String(params.limit));
  }

  const queryString = searchParams.toString();
  const query = queryString ? `?${queryString}` : "";

  return requestJson<WatchlistListResponse>({
    context,
    method: "GET",
    path: `/watchlist${query}`,
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

  return requestJson<WatchlistMembershipResponse>({
    context,
    method: "GET",
    path: `/watchlist/${encodeURIComponent(normalizedTitleId)}`,
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

  return requestJson<WatchlistUpsertResponse>({
    context,
    method: "POST",
    path: "/watchlist",
    signal: params.signal,
    body: JSON.stringify({ titleId: normalizedTitleId }),
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

  await requestVoid({
    context,
    method: "DELETE",
    path: `/watchlist/${encodeURIComponent(normalizedTitleId)}`,
    signal: params.signal,
    failureMessage: "Remove watchlist request failed.",
  });
}
