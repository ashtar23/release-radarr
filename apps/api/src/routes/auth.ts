import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";

import {
  createAuthUser,
  deleteAuthUser,
  isAuthEmailRegistered,
  persistAuthUserIdentity,
} from "../lib/auth";
import {
  SignUpConflictError,
  SignUpValidationError,
  checkEmailAvailability,
  signUpUser,
} from "../lib/auth-service";
import { isUsernameTaken } from "../lib/social/data";
import { ErrorResponseSchema } from "../schemas/common";
import {
  EmailAvailabilityQuerySchema,
  EmailAvailabilityResultSchema,
  SignUpBodySchema,
  SignUpResultSchema,
} from "../schemas/auth";
import { sendInternalServerError } from "./shared";

export function registerAuthRoutes(server: FastifyInstance) {
  server.get<{
    Querystring: Static<typeof EmailAvailabilityQuerySchema>;
  }>(
    "/auth/email-availability",
    {
      schema: {
        tags: ["auth"],
        summary: "Check email availability",
        querystring: EmailAvailabilityQuerySchema,
        response: {
          200: EmailAvailabilityResultSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await checkEmailAvailability(
          {
            email: request.query.email,
          },
          {
            isEmailRegistered: isAuthEmailRegistered,
          },
        );
      } catch (error) {
        return sendInternalServerError(server, reply, error);
      }
    },
  );

  server.post<{
    Body: Static<typeof SignUpBodySchema>;
  }>(
    "/auth/sign-up",
    {
      schema: {
        tags: ["auth"],
        summary: "Create account",
        body: SignUpBodySchema,
        response: {
          200: SignUpResultSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return await signUpUser(
          {
            email: request.body.email,
            password: request.body.password,
            username: request.body.username,
            displayName: request.body.displayName,
          },
          {
            isEmailRegistered: isAuthEmailRegistered,
            isUsernameTaken,
            createAuthUser,
            persistUserIdentity: persistAuthUserIdentity,
            deleteAuthUser,
          },
        );
      } catch (error) {
        if (error instanceof SignUpValidationError) {
          return reply.status(400).send({ error: error.message });
        }

        if (error instanceof SignUpConflictError) {
          return reply.status(409).send({ error: error.message });
        }

        return sendInternalServerError(server, reply, error);
      }
    },
  );
}
