import {
  listWatchlistItems,
  removeWatchlistItem,
  titleExists,
  upsertWatchlistItem,
  type WatchlistSort,
} from "../data/watchlist-repository.ts";
import type { AdminClient } from "../types.ts";
import { jsonResponse } from "../utils/http.ts";

export async function handleWatchlistListRequest(
  client: AdminClient,
  userId: string,
  url: URL,
) {
  const items = await listWatchlistItems(client, userId, parseWatchlistSort(url));
  return jsonResponse({ items });
}

export async function handleWatchlistAddRequest(
  client: AdminClient,
  userId: string,
  request: Request,
) {
  const body = await parseWatchlistMutationBody(request);
  if (!body) {
    return jsonResponse({ error: "titleId is required." }, 400);
  }

  const hasTitle = await titleExists(client, body.titleId);
  if (!hasTitle) {
    return jsonResponse({ error: "Title not found." }, 404);
  }

  const item = await upsertWatchlistItem(client, userId, body.titleId);
  if (!item) {
    return jsonResponse({ error: "Unable to create watchlist item." }, 500);
  }

  return jsonResponse({ item }, 201);
}

export async function handleWatchlistRemoveRequest(
  client: AdminClient,
  userId: string,
  titleId: string,
) {
  const normalizedTitleId = titleId.trim();
  if (!normalizedTitleId) {
    return jsonResponse({ error: "titleId is required." }, 400);
  }

  await removeWatchlistItem(client, userId, normalizedTitleId);
  return jsonResponse({ removed: true });
}

interface WatchlistMutationBody {
  titleId: string;
}

async function parseWatchlistMutationBody(
  request: Request,
): Promise<WatchlistMutationBody | null> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const titleId = (payload as Record<string, unknown>).titleId;
  if (typeof titleId !== "string" || titleId.trim().length === 0) {
    return null;
  }

  return { titleId: titleId.trim() };
}

function parseWatchlistSort(url: URL): WatchlistSort {
  const sort = url.searchParams.get("sort");
  switch (sort) {
    case "added-asc":
    case "added-desc":
    case "release-asc":
    case "release-desc":
    case "name-asc":
    case "name-desc":
      return sort;
    default:
      return "added-desc";
  }
}
