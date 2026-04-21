import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";

import {
  getFollowCounts,
  getProfileByUserId,
  isFollowing,
  listFollowers,
  listFollowing,
  listFriends,
  listProfileRecentAdditionsPreview,
  listProfileWatchlistPage,
  listProfileWatchlistPreview,
} from "../lib/social/data";
import {
  getProfileOverview,
  listProfileConnections,
  listProfileWatchlist,
} from "../lib/social/service";
import { ErrorResponseSchema } from "../schemas/common";
import {
  ProfileConnectionsListResultSchema,
  ProfileListQuerySchema,
  ProfileOverviewResultSchema,
  ProfileParamsSchema,
  ProfileWatchlistListResultSchema,
  UsernameAvailabilityQuerySchema,
  UsernameAvailabilityResultSchema,
} from "../schemas/profile";
import { checkUsernameAvailability } from "../lib/social/service";
import { isUsernameTaken } from "../lib/social/data";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

export function registerProfileRoutes(server: FastifyInstance) {
  server.get<{
    Querystring: Static<typeof UsernameAvailabilityQuerySchema>;
  }>(
    "/profile/username-availability",
    {
      schema: {
        tags: ["profile"],
        summary: "Check username availability",
        querystring: UsernameAvailabilityQuerySchema,
        response: {
          200: UsernameAvailabilityResultSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await checkUsernameAvailability(
          {
            username: request.query.username,
          },
          {
            isUsernameTaken,
          },
        );
      } catch (error) {
        return sendInternalServerError(server, reply, error);
      }
    },
  );

  server.get<{
    Params: Static<typeof ProfileParamsSchema>;
  }>(
    "/profile/:userId",
    {
      schema: {
        tags: ["profile"],
        summary: "Get profile overview",
        security: [{ bearerAuth: [] }],
        params: ProfileParamsSchema,
        response: {
          200: ProfileOverviewResultSchema,
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

      try {
        return await getProfileOverview(
          {
            viewerUserId: user.id,
            targetUserId: request.params.userId,
          },
          {
            getProfileByUserId,
            getFollowCounts,
            isFollowing,
            listProfileWatchlistPreview,
            listProfileRecentAdditionsPreview,
          },
        );
      } catch (error) {
        if (
          error instanceof Error &&
          /profile not found/i.test(error.message)
        ) {
          return reply.status(404).send({ error: error.message });
        }

        return sendInternalServerError(server, reply, error);
      }
    },
  );

  for (const connectionKind of ["followers", "following", "friends"] as const) {
    server.get<{
      Params: Static<typeof ProfileParamsSchema>;
      Querystring: Static<typeof ProfileListQuerySchema>;
    }>(
      `/profile/:userId/${connectionKind}`,
      {
        schema: {
          tags: ["profile"],
          summary: `List profile ${connectionKind}`,
          security: [{ bearerAuth: [] }],
          params: ProfileParamsSchema,
          querystring: ProfileListQuerySchema,
          response: {
            200: ProfileConnectionsListResultSchema,
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
          return await listProfileConnections(
            {
              viewerUserId: user.id,
              targetUserId: request.params.userId,
              kind: connectionKind,
              cursor:
                typeof request.query.cursor === "string" &&
                request.query.cursor.trim().length > 0
                  ? request.query.cursor.trim()
                  : null,
              limit:
                typeof request.query.limit === "string" &&
                Number.isInteger(Number.parseInt(request.query.limit, 10))
                  ? Number.parseInt(request.query.limit, 10)
                  : 20,
            },
            {
              listFollowers,
              listFollowing,
              listFriends,
            },
          );
        } catch (error) {
          return sendInternalServerError(server, reply, error);
        }
      },
    );
  }

  server.get<{
    Params: Static<typeof ProfileParamsSchema>;
    Querystring: Static<typeof ProfileListQuerySchema>;
  }>(
    "/profile/:userId/watchlist",
    {
      schema: {
        tags: ["profile"],
        summary: "List profile watchlist",
        security: [{ bearerAuth: [] }],
        params: ProfileParamsSchema,
        querystring: ProfileListQuerySchema,
        response: {
          200: ProfileWatchlistListResultSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
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

      try {
        return await listProfileWatchlist(
          {
            viewerUserId: user.id,
            targetUserId: request.params.userId,
            cursor:
              typeof request.query.cursor === "string" &&
              request.query.cursor.trim().length > 0
                ? request.query.cursor.trim()
                : null,
            limit:
              typeof request.query.limit === "string" &&
              Number.isInteger(Number.parseInt(request.query.limit, 10))
                ? Number.parseInt(request.query.limit, 10)
                : 20,
          },
          {
            getProfileByUserId,
            isFollowing,
            listProfileWatchlistPage,
          },
        );
      } catch (error) {
        if (error instanceof Error) {
          if (/profile not found/i.test(error.message)) {
            return reply.status(404).send({ error: error.message });
          }

          if (/watchlist is not visible/i.test(error.message)) {
            return reply.status(403).send({ error: error.message });
          }
        }

        return sendInternalServerError(server, reply, error);
      }
    },
  );
}
