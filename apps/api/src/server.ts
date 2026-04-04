import "dotenv/config";

import Fastify from "fastify";

import { env } from "./lib/env";
import { getHomeDiscovery } from "./lib/home-discovery";

const server = Fastify({
  logger: env.appEnv !== "test",
});

server.get("/health", async () => {
  return {
    status: "ok",
    appEnv: env.appEnv,
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

const closeServer = async () => {
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
