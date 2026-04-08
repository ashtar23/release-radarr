import type { FastifyInstance } from "fastify";
import type { WatchlistSort } from "@repo/types";

import {
  addWatchlistItem,
  getWatchlistMembership,
  listWatchlistItems,
  removeWatchlistItem,
  titleExists,
} from "../lib/watchlists";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

interface WatchlistQuerystring {
  cursor?: string;
  limit?: string;
  query?: string;
  sort?: string;
}

interface WatchlistParams {
  titleId: string;
}

interface WatchlistMutationBody {
  titleId: string;
}

export function registerWatchlistRoutes(server: FastifyInstance) {
  server.get<{
    Querystring: WatchlistQuerystring;
  }>("/watchlist", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      const sort = parseWatchlistSort(request.query.sort);
      if (!sort) {
        return reply.status(400).send({ error: "Unsupported watchlist sort." });
      }

      return await listWatchlistItems(user.id, {
        sort,
        query:
          typeof request.query.query === "string" &&
          request.query.query.trim().length > 0
            ? request.query.query.trim()
            : undefined,
        cursor:
          typeof request.query.cursor === "string" &&
          request.query.cursor.trim().length > 0
            ? request.query.cursor.trim()
            : undefined,
        limit:
          typeof request.query.limit === "string" &&
          Number.isInteger(Number.parseInt(request.query.limit, 10))
            ? Number.parseInt(request.query.limit, 10)
            : undefined,
      });
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });

  server.get<{
    Params: WatchlistParams;
  }>("/watchlist/:titleId", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      return await getWatchlistMembership(user.id, request.params.titleId);
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });

  server.post("/watchlist", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    const payload = parseWatchlistMutationBody(request.body);
    if (!payload) {
      return reply.status(400).send({ error: "titleId is required." });
    }

    try {
      const hasTitle = await titleExists(payload.titleId);
      if (!hasTitle) {
        return reply.status(404).send({ error: "Title not found." });
      }

      const result = await addWatchlistItem(user.id, payload.titleId);
      if (!result) {
        return reply
          .status(500)
          .send({ error: "Unable to create watchlist item." });
      }

      return reply.status(201).send(result);
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });

  server.delete<{
    Params: WatchlistParams;
  }>("/watchlist/:titleId", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      await removeWatchlistItem(user.id, request.params.titleId);
      return { removed: true };
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });
}

function parseWatchlistMutationBody(
  value: unknown,
): WatchlistMutationBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const titleId = (value as Record<string, unknown>).titleId;
  if (typeof titleId !== "string" || titleId.trim().length === 0) {
    return null;
  }

  return { titleId: titleId.trim() };
}

function parseWatchlistSort(value: string | undefined): WatchlistSort | null {
  switch (value) {
    case undefined:
    case "added-desc":
      return "added-desc";
    case "added-asc":
    case "release-desc":
    case "release-asc":
    case "name-asc":
    case "name-desc":
      return value;
    default:
      return null;
  }
}
