import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";

import {
  authUserExists,
  createFollow,
  deleteFollow,
  isFollowing,
} from "../lib/social/data";
import { followUser, unfollowUser } from "../lib/social/service";
import { ErrorResponseSchema } from "../schemas/common";
import {
  SocialFollowingMutationResultSchema,
  SocialFollowingParamsSchema,
} from "../schemas/social";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

export function registerSocialRoutes(server: FastifyInstance) {
  server.put<{
    Params: Static<typeof SocialFollowingParamsSchema>;
  }>(
    "/social/following/:userId",
    {
      schema: {
        tags: ["social"],
        summary: "Follow a user",
        security: [{ bearerAuth: [] }],
        params: SocialFollowingParamsSchema,
        response: {
          200: SocialFollowingMutationResultSchema,
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

      try {
        return await followUser(
          {
            actorUserId: user.id,
            targetUserId: request.params.userId,
          },
          {
            userExists: authUserExists,
            createFollow,
            isFollowing,
          },
        );
      } catch (error) {
        if (error instanceof Error) {
          if (/cannot follow yourself/i.test(error.message)) {
            return reply.status(400).send({ error: error.message });
          }

          if (/target user not found/i.test(error.message)) {
            return reply.status(404).send({ error: error.message });
          }
        }

        return sendInternalServerError(server, reply, error);
      }
    },
  );

  server.delete<{
    Params: Static<typeof SocialFollowingParamsSchema>;
  }>(
    "/social/following/:userId",
    {
      schema: {
        tags: ["social"],
        summary: "Unfollow a user",
        security: [{ bearerAuth: [] }],
        params: SocialFollowingParamsSchema,
        response: {
          200: SocialFollowingMutationResultSchema,
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
        return await unfollowUser(
          {
            actorUserId: user.id,
            targetUserId: request.params.userId,
          },
          {
            deleteFollow,
          },
        );
      } catch (error) {
        return sendInternalServerError(server, reply, error);
      }
    },
  );
}
