import "dotenv/config";

import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";

import { env } from "./lib/env";
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

server.get("/health", async () => {
  return {
    status: "ok",
    appEnv: env.appEnv,
    dataSource: env.dataSource,
  };
});

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
    await server.register(cors, {
      origin(
        origin: string | undefined,
        callback: (error: Error | null, origin: boolean) => void,
      ) {
        if (!origin) {
          callback(null, true);
          return;
        }

        callback(null, env.corsAllowedOrigins.includes(origin));
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["authorization", "apikey", "content-type"],
    });
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
