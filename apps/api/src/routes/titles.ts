import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";

import { searchTitles } from "../lib/search";
import { ErrorResponseSchema } from "../schemas/common";
import {
  SearchTitlesQuerySchema,
  TitleDetailsResultSchema,
  TitleParamsSchema,
  TitleSearchResultSchema,
} from "../schemas/titles";
import { getTitleDetails } from "../lib/titles";
import {
  authenticateOptionalRouteRequest,
  sendInternalServerError,
} from "./shared";

export function registerTitleRoutes(server: FastifyInstance) {
  server.get<{
    Querystring: Static<typeof SearchTitlesQuerySchema>;
  }>(
    "/titles",
    {
      schema: {
        tags: ["titles"],
        summary: "Search titles",
        querystring: SearchTitlesQuerySchema,
        response: {
          200: TitleSearchResultSchema,
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const query = request.query.query?.trim() ?? "";
      if (query.length < 2) {
        return reply
          .status(400)
          .send({ error: "Query must be at least 2 characters." });
      }

      try {
        return await searchTitles({
          query,
          page: parsePositiveInteger(request.query.page, 1),
          limit: parsePositiveInteger(request.query.limit, 20),
          forceRefresh: isTruthyQueryFlag(request.query.forceRefresh),
        });
      } catch (error) {
        return sendInternalServerError(server, reply, error);
      }
    },
  );

  server.get<{
    Params: Static<typeof TitleParamsSchema>;
  }>(
    "/titles/:titleId",
    {
      schema: {
        tags: ["titles"],
        summary: "Get title details",
        params: TitleParamsSchema,
        response: {
          200: TitleDetailsResultSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const titleId = request.params.titleId.trim();
      if (!titleId) {
        return reply.status(400).send({ error: "Title id is required." });
      }

      const auth = await authenticateOptionalRouteRequest(
        server,
        reply,
        request.headers.authorization,
      );
      if (auth.status === "failed") {
        return;
      }

      try {
        const result = await getTitleDetails(
          titleId,
          auth.status === "authenticated" ? auth.user.id : null,
        );
        if (!result) {
          return reply.status(404).send({ error: "Title not found." });
        }

        return result;
      } catch (error) {
        return sendInternalServerError(server, reply, error);
      }
    },
  );
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isTruthyQueryFlag(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}
