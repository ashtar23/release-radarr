import "dotenv/config";

import Fastify from "fastify";

import { env } from "./lib/env";
import { closePostgresPool } from "./lib/postgres";
import { registerHomeRoutes } from "./routes/home";
import { registerNotificationRoutes } from "./routes/notifications";

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

registerHomeRoutes(server);
registerNotificationRoutes(server);

const closeServer = async () => {
  await closePostgresPool();
  await server.close();
  process.exit(0);
};

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

server
  .listen({
    host: env.host,
    port: env.port,
  })
  .catch((error) => {
    logServerError(error);
    process.exit(1);
  });

function logServerError(error: unknown) {
  if (error instanceof Error) {
    server.log.error(error);
    return;
  }

  server.log.error({ error }, "Unexpected server error");
}
