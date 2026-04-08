import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

import { env } from "./env";

export function shouldEnableApiDocs() {
  return env.appEnv !== "production";
}

export async function registerOpenApi(server: FastifyInstance) {
  await server.register(swagger, {
    openapi: {
      info: {
        title: "Soonr API",
        description:
          "Fastify backend for Soonr application routes, interactive docs, and generated client contracts.",
        version: "0.1.0",
      },
      servers: [
        {
          url: `http://${env.host === "0.0.0.0" ? "localhost" : env.host}:${env.port}`,
          description: "Local API",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });

  server.get("/openapi.json", async (_request, reply) => {
    return reply.send(server.swagger());
  });
}
