import type { FastifyInstance } from "fastify";
import type { NotificationTimingPreset } from "@repo/types";

import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotificationRecords,
  updateNotificationPreferences,
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

  server.get("/notification-preferences", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      return await getNotificationPreferences(user.id);
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });

  server.put("/notification-preferences", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    const payload = parseNotificationPreferencesBody(request.body);
    if (!payload) {
      return reply
        .status(400)
        .send({ error: "Notification preferences payload is invalid." });
    }

    try {
      return await updateNotificationPreferences(user.id, payload);
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });
}

function parseNotificationPreferencesBody(body: unknown): {
  channels: { inApp: boolean; push: boolean };
  events: { releaseDateChanged: boolean; releaseApproaching: boolean };
  timingPresets: NotificationTimingPreset[];
} | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const channels =
    record.channels && typeof record.channels === "object"
      ? (record.channels as Record<string, unknown>)
      : null;
  const events =
    record.events && typeof record.events === "object"
      ? (record.events as Record<string, unknown>)
      : null;
  const timingPresets = Array.isArray(record.timingPresets)
    ? record.timingPresets.flatMap((value) => parseTimingPreset(value))
    : null;

  if (
    !channels ||
    !events ||
    typeof channels.inApp !== "boolean" ||
    typeof channels.push !== "boolean" ||
    typeof events.releaseDateChanged !== "boolean" ||
    typeof events.releaseApproaching !== "boolean" ||
    !timingPresets
  ) {
    return null;
  }

  return {
    channels: {
      inApp: channels.inApp,
      push: channels.push,
    },
    events: {
      releaseDateChanged: events.releaseDateChanged,
      releaseApproaching: events.releaseApproaching,
    },
    timingPresets,
  };
}

function parseTimingPreset(value: unknown): NotificationTimingPreset[] {
  switch (value) {
    case "on_day":
    case "hours_24_before":
    case "days_7_before":
    case "days_30_before":
      return [value];
    default:
      return [];
  }
}
