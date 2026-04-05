import type { FastifyInstance } from "fastify";

import {
  getNotificationUnreadCount,
  listNotificationRecords,
} from "../lib/notifications";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

export function registerNotificationRoutes(server: FastifyInstance) {
  server.get("/notifications/unread-count", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      return await getNotificationUnreadCount(user.id);
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });

  server.get("/notifications", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      const query = request.query as {
        cursor?: string;
        limit?: string;
      };

      return await listNotificationRecords(user.id, {
        cursor:
          typeof query.cursor === "string" && query.cursor.trim().length > 0
            ? query.cursor
            : undefined,
        limit:
          typeof query.limit === "string" &&
          Number.isInteger(Number.parseInt(query.limit, 10))
            ? Number.parseInt(query.limit, 10)
            : undefined,
      });
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });
}
