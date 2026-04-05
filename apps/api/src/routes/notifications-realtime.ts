import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import { authenticateAccessToken } from "../lib/auth";
import {
  registerNotificationsRealtimeSocket,
  sendNotificationsRealtimeError,
  sendNotificationsRealtimePong,
  sendNotificationsRealtimeReady,
  unregisterNotificationsRealtimeSocket,
} from "../lib/notifications-realtime";

type NotificationsRealtimeClientMessage =
  | {
      type: "auth";
      accessToken: string;
    }
  | {
      type: "ping";
    };

const AUTH_TIMEOUT_MS = 5_000;

export function registerNotificationsRealtimeRoutes(server: FastifyInstance) {
  server.get("/notifications/stream", { websocket: true }, (socket) => {
    let authenticatedUserId: string | null = null;

    const authTimeout = setTimeout(() => {
      sendNotificationsRealtimeError(socket, "Authentication timeout.");
      socket.close(4401, "Authentication timeout");
    }, AUTH_TIMEOUT_MS);

    const closeSocket = (code: number, reason: string) => {
      sendNotificationsRealtimeError(socket, reason);
      socket.close(code, reason);
    };

    socket.on("message", async (value) => {
      const message = parseClientMessage(value);
      if (!message) {
        closeSocket(4400, "Invalid realtime payload.");
        return;
      }

      if (message.type === "ping") {
        sendNotificationsRealtimePong(socket);
        return;
      }

      if (authenticatedUserId) {
        closeSocket(4400, "Realtime client is already authenticated.");
        return;
      }

      try {
        const user = await authenticateAccessToken(message.accessToken);
        if (!user) {
          closeSocket(4401, "Authentication failed.");
          return;
        }

        authenticatedUserId = user.id;
        clearTimeout(authTimeout);
        registerNotificationsRealtimeSocket(user.id, socket);
        sendNotificationsRealtimeReady(socket);
      } catch (error) {
        server.log.error(error, "Notifications realtime authentication failed");
        closeSocket(1011, "Realtime authentication failed.");
      }
    });

    socket.on("close", () => {
      clearTimeout(authTimeout);

      if (authenticatedUserId) {
        unregisterNotificationsRealtimeSocket(authenticatedUserId, socket);
      }
    });

    socket.on("error", (error) => {
      server.log.error(error, "Notifications realtime socket error");
    });
  });
}

function parseClientMessage(
  value: Parameters<WebSocket["on"]>[1] extends never ? never : unknown,
): NotificationsRealtimeClientMessage | null {
  const text = normalizeMessageText(value);
  if (!text) {
    return null;
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;

    if (parsed.type === "ping") {
      return { type: "ping" };
    }

    if (
      parsed.type === "auth" &&
      typeof parsed.accessToken === "string" &&
      parsed.accessToken.trim().length > 0
    ) {
      return {
        type: "auth",
        accessToken: parsed.accessToken,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeMessageText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }

  if (Array.isArray(value)) {
    return Buffer.concat(value).toString("utf8");
  }

  return null;
}
