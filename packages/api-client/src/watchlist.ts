import { API_PATH_PREFIX } from "@repo/config";
import type {
  AddWatchlistItemInput,
  RemoveWatchlistItemInput,
  WatchlistListResult,
  WatchlistUpsertResult,
} from "@repo/types";

import {
  isWatchlistListResult,
  isWatchlistUpsertResult,
} from "./payload-guards";
import { requestJson, requestVoid, type RequestContext } from "./request";

export interface ListWatchlistParams {
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
}: ListWatchlistRequestParams): Promise<WatchlistListResult> {
  return requestJson({
    context,
    method: "GET",
    path: `${API_PATH_PREFIX}/watchlist`,
    signal: params?.signal,
    validate: isWatchlistListResult,
    invalidPayloadMessage: "Watchlist payload is invalid.",
    failureMessage: "Watchlist request failed.",
  });
}

export function addWatchlistItem({
  context,
  params,
}: AddWatchlistItemRequestParams): Promise<WatchlistUpsertResult> {
  const normalizedTitleId = params.titleId.trim();
  if (!normalizedTitleId) {
    throw new Error("titleId is required.");
  }

  return requestJson({
    context,
    method: "POST",
    path: `${API_PATH_PREFIX}/watchlist`,
    signal: params.signal,
    body: JSON.stringify({ titleId: normalizedTitleId }),
    validate: isWatchlistUpsertResult,
    invalidPayloadMessage: "Watchlist add payload is invalid.",
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
    path: `${API_PATH_PREFIX}/watchlist/${encodeURIComponent(normalizedTitleId)}`,
    signal: params.signal,
    failureMessage: "Remove watchlist request failed.",
  });
}
