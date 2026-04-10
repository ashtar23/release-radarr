import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";

import {
  getHomeDiscovery,
  listHomeDiscoverySectionPage,
} from "../lib/home-discovery";
import { ErrorResponseSchema } from "../schemas/common";
import {
  HomeDiscoveryPageQuerySchema,
  HomeDiscoveryPageResultSchema,
  HomeDiscoveryResultSchema,
} from "../schemas/home";
import { sendInternalServerError } from "./shared";

export function registerHomeRoutes(server: FastifyInstance) {
  server.get(
    "/home/discovery",
    {
      schema: {
        tags: ["home"],
        summary: "Get home discovery rails",
        response: {
          200: HomeDiscoveryResultSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      try {
        return await getHomeDiscovery();
      } catch (error) {
        return sendInternalServerError(server, reply, error);
      }
    },
  );

  server.get<{
    Querystring: Static<typeof HomeDiscoveryPageQuerySchema>;
  }>(
    "/home/discovery/upcoming",
    {
      schema: {
        tags: ["home"],
        summary: "List upcoming discovery titles",
        querystring: HomeDiscoveryPageQuerySchema,
        response: {
          200: HomeDiscoveryPageResultSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await listHomeDiscoverySectionPage("upcoming", {
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
    Querystring: Static<typeof HomeDiscoveryPageQuerySchema>;
  }>(
    "/home/discovery/latest",
    {
      schema: {
        tags: ["home"],
        summary: "List recently released discovery titles",
        querystring: HomeDiscoveryPageQuerySchema,
        response: {
          200: HomeDiscoveryPageResultSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await listHomeDiscoverySectionPage("latest", {
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
    Querystring: Static<typeof HomeDiscoveryPageQuerySchema>;
  }>(
    "/home/discovery/popular",
    {
      schema: {
        tags: ["home"],
        summary: "List worth-watching discovery titles",
        querystring: HomeDiscoveryPageQuerySchema,
        response: {
          200: HomeDiscoveryPageResultSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await listHomeDiscoverySectionPage("popular", {
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
}
