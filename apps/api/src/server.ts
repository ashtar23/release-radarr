import "dotenv/config";

import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";

import { env, resolveCorsAllowedOrigins } from "./lib/env";
import { registerOpenApi, shouldEnableApiDocs } from "./lib/openapi";
import { HealthStatusSchema } from "./schemas/common";
import {
  closeNotificationsRealtime,
  startNotificationsRealtime,
} from "./lib/notifications-realtime";
import { closePostgresPool } from "./lib/postgres";
import { registerHomeRoutes } from "./routes/home";
import { registerNotificationsRealtimeRoutes } from "./routes/notifications-realtime";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerTitleRoutes } from "./routes/titles";
import { registerWatchlistRoutes } from "./routes/watchlist";

const server = Fastify({
  logger: env.appEnv !== "test",
});
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

const closeServer = async () => {
  await closeNotificationsRealtime();
  await closePostgresPool();
  await server.close();
  process.exit(0);
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

void bootstrap();

async function bootstrap() {
  try {
    const corsAllowedOrigins = resolveCorsAllowedOrigins(env.appEnv);

    await server.register(cors, {
      origin(
        origin: string | undefined,
        callback: (error: Error | null, origin: boolean) => void,
      ) {
        if (!origin) {
          callback(null, true);
          return;
        }

        callback(null, corsAllowedOrigins.includes(origin));
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["authorization", "apikey", "content-type"],
    });

    if (shouldEnableApiDocs()) {
      await registerOpenApi(server);
    }

    await server.register(websocket);

    registerHomeRoutes(server);
    registerTitleRoutes(server);
    registerNotificationRoutes(server);
    registerWatchlistRoutes(server);
    registerNotificationsRealtimeRoutes(server);

    await startNotificationsRealtime(server.log);

    await server.listen({
      host: env.host,
      port: env.port,
    });
  } catch (error) {
    logServerError(error);
    process.exit(1);
  }
}

function logServerError(error: unknown) {
  if (error instanceof Error) {
    server.log.error(error);
    return;
  }

  server.log.error({ error }, "Unexpected server error");
}
