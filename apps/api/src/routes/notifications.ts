import type { FastifyInstance } from "fastify";
import type {
  NotificationTimingPreset,
  UpdateNotificationPreferencesInput,
} from "@repo/types";

import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotificationRecords,
  markAllAsRead,
  markAsRead,
  updateNotificationPreferences,
} from "../lib/notifications";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

interface NotificationsQuerystring {
  cursor?: string;
  limit?: string;
}

interface NotificationReadParams {
  notificationId: string;
}

type NotificationChannelsInput = UpdateNotificationPreferencesInput["channels"];
type NotificationEventsInput = UpdateNotificationPreferencesInput["events"];

function tryDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getNotificationIdCandidates(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  return [
    ...new Set([
      trimmedValue,
      tryDecodeURIComponent(trimmedValue),
      tryDecodeURIComponent(tryDecodeURIComponent(trimmedValue)),
    ]),
  ].filter(Boolean);
}

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

  server.get<{
    Querystring: NotificationsQuerystring;
  }>("/notifications", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      const { cursor, limit } = request.query;

      return await listNotificationRecords(user.id, {
        cursor:
          typeof cursor === "string" && cursor.trim().length > 0
            ? cursor
            : undefined,
        limit:
          typeof limit === "string" &&
          Number.isInteger(Number.parseInt(limit, 10))
            ? Number.parseInt(limit, 10)
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

  server.post<{
    Params: NotificationReadParams;
  }>("/notifications/:notificationId/read", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    const notificationIdCandidates = getNotificationIdCandidates(
      request.params.notificationId,
    );
    const notificationId = notificationIdCandidates[0] ?? "";

    if (!notificationId) {
      return reply.status(400).send({ error: "notificationId is required." });
    }

    try {
      const result = await markAsRead(user.id, notificationIdCandidates);
      if (!result) {
        server.log.warn(
          {
            userId: user.id,
            rawNotificationId: request.params.notificationId,
            notificationId,
            notificationIdCandidates,
          },
          "Notification read request could not find a matching row.",
        );
        return reply.status(404).send({ error: "Notification not found." });
      }

      return result;
    } catch (error) {
      return sendInternalServerError(server, reply, error);
    }
  });

  server.post("/notifications/read-all", async (request, reply) => {
    const user = await authenticateRouteRequest(
      server,
      reply,
      request.headers.authorization,
    );
    if (!user) {
      return;
    }

    try {
      return await markAllAsRead(user.id);
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

function parseNotificationPreferencesBody(
  body: unknown,
): UpdateNotificationPreferencesInput | null {
  if (!isRecord(body)) {
    return null;
  }

  const channels = isNotificationChannelsInput(body.channels)
    ? body.channels
    : null;
  const events = isNotificationEventsInput(body.events) ? body.events : null;
  const timingPresets = Array.isArray(body.timingPresets)
    ? body.timingPresets.flatMap((value) => parseTimingPreset(value))
    : null;

  if (!channels || !events || !timingPresets) {
    return null;
  }

  return {
    channels,
    events,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNotificationChannelsInput(
  value: unknown,
): value is NotificationChannelsInput {
  return (
    isRecord(value) &&
    typeof value.inApp === "boolean" &&
    typeof value.push === "boolean"
  );
}

function isNotificationEventsInput(
  value: unknown,
): value is NotificationEventsInput {
  return (
    isRecord(value) &&
    typeof value.releaseDateChanged === "boolean" &&
    typeof value.releaseApproaching === "boolean"
  );
}
