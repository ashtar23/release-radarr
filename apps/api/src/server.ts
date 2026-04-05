import "dotenv/config";

import Fastify from "fastify";

import { authenticateAccessToken, extractAccessToken } from "./lib/auth";
import { env } from "./lib/env";
import { getHomeDiscovery } from "./lib/home-discovery";
import { getNotificationUnreadCount } from "./lib/notifications";
import { closePostgresPool } from "./lib/postgres";

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

server.get("/home/discovery", async (_request, reply) => {
  try {
    const payload = await getHomeDiscovery();
    return payload;
  } catch (error) {
    requestLogError(error);
    return reply.status(500).send({
      error:
        error instanceof Error ? error.message : "Unexpected server error.",
    });
  }
});

server.get("/notifications/unread-count", async (request, reply) => {
  try {
    const accessToken = extractAccessToken(request.headers.authorization);
    if (!accessToken) {
      return reply.status(401).send({ error: "Authorization is required." });
    }

    const user = await authenticateAccessToken(accessToken);
    if (!user) {
      return reply.status(401).send({ error: "Authentication failed." });
    }

    const payload = await getNotificationUnreadCount(user.id);
    return payload;
  } catch (error) {
    requestLogError(error);
    return reply.status(500).send({
      error:
        error instanceof Error ? error.message : "Unexpected server error.",
    });
  }
});

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
    requestLogError(error);
    process.exit(1);
  });

function requestLogError(error: unknown) {
  if (error instanceof Error) {
    server.log.error(error);
    return;
  }

  server.log.error({ error }, "Unexpected server error");
}
