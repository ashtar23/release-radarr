import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";
import type { WatchlistSort } from "@repo/types";

import {
  addWatchlistItem,
  getWatchlistMembership,
  listWatchlistItems,
  removeWatchlistItem,
  titleExists,
} from "../lib/watchlists";
import { ErrorResponseSchema } from "../schemas/common";
import {
  WatchlistListResultSchema,
  WatchlistMembershipResultSchema,
  WatchlistMutationBodySchema,
  WatchlistParamsSchema,
  WatchlistQuerySchema,
  WatchlistRemovedResultSchema,
  WatchlistUpsertResultSchema,
} from "../schemas/watchlist";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

export function registerWatchlistRoutes(server: FastifyInstance) {
  server.get<{
    Querystring: Static<typeof WatchlistQuerySchema>;
  }>(
    "/watchlist",
    {
      schema: {
        tags: ["watchlist"],
        summary: "List watchlist items",
        security: [{ bearerAuth: [] }],
        querystring: WatchlistQuerySchema,
        response: {
          200: WatchlistListResultSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.get<{
    Params: Static<typeof WatchlistParamsSchema>;
  }>(
    "/watchlist/:titleId",
    {
      schema: {
        tags: ["watchlist"],
        summary: "Get watchlist membership for a title",
        security: [{ bearerAuth: [] }],
        params: WatchlistParamsSchema,
        response: {
          200: WatchlistMembershipResultSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.post<{
    Body: Static<typeof WatchlistMutationBodySchema>;
  }>(
    "/watchlist",
    {
      schema: {
        tags: ["watchlist"],
        summary: "Add a title to the watchlist",
        security: [{ bearerAuth: [] }],
        body: WatchlistMutationBodySchema,
        response: {
          201: WatchlistUpsertResultSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.delete<{
    Params: Static<typeof WatchlistParamsSchema>;
  }>(
    "/watchlist/:titleId",
    {
      schema: {
        tags: ["watchlist"],
        summary: "Remove a title from the watchlist",
        security: [{ bearerAuth: [] }],
        params: WatchlistParamsSchema,
        response: {
          200: WatchlistRemovedResultSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );
}

function parseWatchlistMutationBody(
  value: unknown,
): Static<typeof WatchlistMutationBodySchema> | null {
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
