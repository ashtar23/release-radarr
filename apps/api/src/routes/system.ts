import type { FastifyInstance } from "fastify";

import { env } from "../lib/env";
import { HealthStatusSchema } from "../schemas/common";

export function registerSystemRoutes(server: FastifyInstance) {
  server.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        summary: "Get API health status",
        response: {
          200: HealthStatusSchema,
        },
      },
    },
    async () => {
      return {
        status: "ok",
        appEnv: env.appEnv,
        dataSource: env.dataSource,
      };
    },
  );
}
