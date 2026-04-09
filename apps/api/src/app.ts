import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";

import { env, resolveCorsAllowedOrigins } from "./lib/env";
import { registerOpenApi, shouldEnableApiDocs } from "./lib/openapi";
import { registerHomeRoutes } from "./routes/home";
import { registerNotificationsRealtimeRoutes } from "./routes/notifications-realtime";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerSystemRoutes } from "./routes/system";
import { registerTitleRoutes } from "./routes/titles";
import { registerWatchlistRoutes } from "./routes/watchlist";

export interface BuildServerOptions {
  readonly enableApiDocs?: boolean;
}

export async function buildServer(options: BuildServerOptions = {}) {
  const server = Fastify({
    logger: env.appEnv !== "test",
  });
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

  if (options.enableApiDocs ?? shouldEnableApiDocs()) {
    await registerOpenApi(server);
  }

  await server.register(websocket);

  registerSystemRoutes(server);
  registerHomeRoutes(server);
  registerTitleRoutes(server);
  registerNotificationRoutes(server);
  registerWatchlistRoutes(server);
  registerNotificationsRealtimeRoutes(server);

  return server;
}
