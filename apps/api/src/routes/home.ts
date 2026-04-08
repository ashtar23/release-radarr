import type { FastifyInstance } from "fastify";

import { getHomeDiscovery } from "../lib/home-discovery";
import { ErrorResponseSchema } from "../schemas/common";
import { HomeDiscoveryResultSchema } from "../schemas/home";
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
}
