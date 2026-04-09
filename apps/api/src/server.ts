import "dotenv/config";

import { env } from "./lib/env";
import { buildServer } from "./app";
import {
  closeNotificationsRealtime,
  startNotificationsRealtime,
} from "./lib/notifications-realtime";
import { closePostgresPool } from "./lib/postgres";

const server = await buildServer();

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
