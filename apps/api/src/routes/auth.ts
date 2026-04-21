import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";

import { isAuthEmailRegistered } from "../lib/auth";
import { checkEmailAvailability } from "../lib/auth-service";
import { ErrorResponseSchema } from "../schemas/common";
import {
  EmailAvailabilityQuerySchema,
  EmailAvailabilityResultSchema,
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
}
