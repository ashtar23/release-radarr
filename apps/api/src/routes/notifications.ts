import type { FastifyInstance, FastifyReply } from "fastify";
import type { Static } from "@sinclair/typebox";
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
import { ErrorResponseSchema } from "../schemas/common";
import {
  MarkAllNotificationsReadResultSchema,
  MarkNotificationReadResultSchema,
  NotificationPreferencesResultSchema,
  NotificationReadBodySchema,
  NotificationUnreadCountResultSchema,
  NotificationsQuerySchema,
  NotificationRecordListResultSchema,
  UpdateNotificationPreferencesBodySchema,
} from "../schemas/notifications";
import { authenticateRouteRequest, sendInternalServerError } from "./shared";

type NotificationChannelsInput = UpdateNotificationPreferencesInput["channels"];
type NotificationEventsInput = UpdateNotificationPreferencesInput["events"];

export function registerNotificationRoutes(server: FastifyInstance) {
  server.get(
    "/notifications/unread-count",
    {
      schema: {
        tags: ["notifications"],
        summary: "Get unread notification count",
        security: [{ bearerAuth: [] }],
        response: {
          200: NotificationUnreadCountResultSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.get<{
    Querystring: Static<typeof NotificationsQuerySchema>;
  }>(
    "/notifications",
    {
      schema: {
        tags: ["notifications"],
        summary: "List notifications",
        security: [{ bearerAuth: [] }],
        querystring: NotificationsQuerySchema,
        response: {
          200: NotificationRecordListResultSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.get(
    "/notification-preferences",
    {
      schema: {
        tags: ["notifications"],
        summary: "Get notification preferences",
        security: [{ bearerAuth: [] }],
        response: {
          200: NotificationPreferencesResultSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.post<{
    Body: Static<typeof NotificationReadBodySchema>;
  }>(
    "/notifications/read",
    {
      schema: {
        tags: ["notifications"],
        summary: "Mark a notification as read",
        security: [{ bearerAuth: [] }],
        body: NotificationReadBodySchema,
        response: {
          200: MarkNotificationReadResultSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = await authenticateRouteRequest(
        server,
        reply,
        request.headers.authorization,
      );
      if (!user) {
        return;
      }

      return handleNotificationReadRequest({
        server,
        reply,
        userId: user.id,
        notificationId: parseNotificationReadBody(request.body),
      });
    },
  );

  server.post(
    "/notifications/read-all",
    {
      schema: {
        tags: ["notifications"],
        summary: "Mark all notifications as read",
        security: [{ bearerAuth: [] }],
        response: {
          200: MarkAllNotificationsReadResultSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  server.put<{
    Body: Static<typeof UpdateNotificationPreferencesBodySchema>;
  }>(
    "/notification-preferences",
    {
      schema: {
        tags: ["notifications"],
        summary: "Update notification preferences",
        security: [{ bearerAuth: [] }],
        body: UpdateNotificationPreferencesBodySchema,
        response: {
          200: NotificationPreferencesResultSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );
}

async function handleNotificationReadRequest({
  server,
  reply,
  userId,
  notificationId,
}: {
  server: FastifyInstance;
  reply: FastifyReply;
  userId: string;
  notificationId: string;
}) {
  if (!notificationId) {
    return reply.status(400).send({ error: "notificationId is required." });
  }

  try {
    const result = await markAsRead(userId, notificationId);
    if (!result) {
      server.log.warn(
        {
          userId,
          notificationId,
        },
        "Notification read request could not find a matching row.",
      );
      return reply.status(404).send({ error: "Notification not found." });
    }

    return result;
  } catch (error) {
    return sendInternalServerError(server, reply, error);
  }
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

function parseNotificationReadBody(body: unknown) {
  if (!isRecord(body) || typeof body.notificationId !== "string") {
    return "";
  }

  return body.notificationId.trim();
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
