import type { FastifyInstance } from "fastify";

import { getHomeDiscovery } from "../lib/home-discovery";
import { sendInternalServerError } from "./shared";

export function registerHomeRoutes(server: FastifyInstance) {
  server.get("/home/discovery", async (_request, reply) => {
    try {
      return await getHomeDiscovery();
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });
}
