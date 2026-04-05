import type { FastifyBaseLogger } from "fastify";
import { Client } from "pg";
import type { WebSocket } from "ws";

import { env } from "./env";

type NotificationRealtimeScope = "records" | "preferences";

type NotificationRealtimePayload = {
  userId: string;
  scope: NotificationRealtimeScope;
};

type NotificationRealtimeEvent = {
  type: "notifications.changed";
  scope: NotificationRealtimeScope;
};

const NOTIFICATIONS_REALTIME_CHANNEL = "notifications_realtime";
const OPEN_SOCKET_STATE = 1;

const socketsByUserId = new Map<string, Set<WebSocket>>();

let listenerClient: Client | null = null;
let listenerStartPromise: Promise<void> | null = null;

export async function startNotificationsRealtime(logger: FastifyBaseLogger) {
  if (listenerClient) {
    return;
  }

  if (listenerStartPromise) {
    await listenerStartPromise;
    return;
  }

  listenerStartPromise = (async () => {
    if (!env.databaseUrl) {
      throw new Error(
        "DATABASE_URL is required to start notifications realtime.",
      );
    }

    const client = new Client({
      connectionString: env.databaseUrl,
    });

    client.on("notification", (message) => {
      handleDatabaseNotification(logger, message.channel, message.payload);
    });

    client.on("error", (error) => {
      logger.error(error, "Notifications realtime listener error");
    });

    client.on("end", () => {
      listenerClient = null;
      logger.warn("Notifications realtime listener disconnected");
    });

    await client.connect();
    await client.query(`listen ${NOTIFICATIONS_REALTIME_CHANNEL}`);

    listenerClient = client;
    logger.info("Notifications realtime listener connected");
  })().finally(() => {
    listenerStartPromise = null;
  });

  await listenerStartPromise;
}

export async function closeNotificationsRealtime() {
  const client = listenerClient;
  listenerClient = null;

  if (client) {
    await client.end().catch(() => {});
  }

  for (const sockets of socketsByUserId.values()) {
    for (const socket of sockets) {
      socket.close();
    }
  }

  socketsByUserId.clear();
}

export function registerNotificationsRealtimeSocket(
  userId: string,
  socket: WebSocket,
) {
  const sockets = socketsByUserId.get(userId) ?? new Set<WebSocket>();
  sockets.add(socket);
  socketsByUserId.set(userId, sockets);
}

export function unregisterNotificationsRealtimeSocket(
  userId: string,
  socket: WebSocket,
) {
  const sockets = socketsByUserId.get(userId);
  if (!sockets) {
    return;
  }

  sockets.delete(socket);
  if (sockets.size === 0) {
    socketsByUserId.delete(userId);
  }
}

export function sendNotificationsRealtimeReady(socket: WebSocket) {
  sendJson(socket, {
    type: "ready",
  });
}

export function sendNotificationsRealtimeError(
  socket: WebSocket,
  message: string,
) {
  sendJson(socket, {
    type: "error",
    message,
  });
}

export function sendNotificationsRealtimePong(socket: WebSocket) {
  sendJson(socket, {
    type: "pong",
  });
}

function handleDatabaseNotification(
  logger: FastifyBaseLogger,
  channel: string,
  payload: string | undefined,
) {
  if (channel !== NOTIFICATIONS_REALTIME_CHANNEL || !payload) {
    return;
  }

  let parsed: NotificationRealtimePayload;

  try {
    parsed = JSON.parse(payload) as NotificationRealtimePayload;
  } catch (error) {
    logger.error(error, "Failed to parse notifications realtime payload");
    return;
  }

  if (
    typeof parsed.userId !== "string" ||
    (parsed.scope !== "records" && parsed.scope !== "preferences")
  ) {
    logger.warn(
      { payload },
      "Ignored malformed notifications realtime payload",
    );
    return;
  }

  const sockets = socketsByUserId.get(parsed.userId);
  if (!sockets || sockets.size === 0) {
    return;
  }

  for (const socket of sockets) {
    if (socket.readyState !== OPEN_SOCKET_STATE) {
      sockets.delete(socket);
      continue;
    }

    sendJson(socket, {
      type: "notifications.changed",
      scope: parsed.scope,
    } satisfies NotificationRealtimeEvent);
  }

  if (sockets.size === 0) {
    socketsByUserId.delete(parsed.userId);
  }
}

function sendJson(socket: WebSocket, payload: object) {
  if (socket.readyState !== OPEN_SOCKET_STATE) {
    return;
  }

  socket.send(JSON.stringify(payload));
}
