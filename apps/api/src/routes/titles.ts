import type { FastifyInstance } from "fastify";

import { getTitleDetails } from "../lib/titles";
import {
  authenticateOptionalRouteRequest,
  sendInternalServerError,
} from "./shared";

interface TitleParams {
  titleId: string;
}

export function registerTitleRoutes(server: FastifyInstance) {
  server.get<{
    Params: TitleParams;
  }>("/titles/:titleId", async (request, reply) => {
    const titleId = request.params.titleId.trim();
    if (!titleId) {
      return reply.status(400).send({ error: "Title id is required." });
    }

    const auth = await authenticateOptionalRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (auth.status === "failed") {
      return;
    }

    try {
      const result = await getTitleDetails(
        titleId,
        auth.status === "authenticated" ? auth.user.id : null,
      );
      if (!result) {
        return reply.status(404).send({ error: "Title not found." });
      }

      return result;
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });
}
