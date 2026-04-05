import type { FastifyInstance, FastifyReply } from "fastify";

import { authenticateAccessToken, extractAccessToken } from "../lib/auth";

type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof authenticateAccessToken>>
>;

export async function authenticateRouteRequest(
  server: FastifyInstance,
  reply: FastifyReply,
  authorizationHeader: string | string[] | undefined,
): Promise<AuthenticatedUser | null> {
  const accessToken = extractAccessToken(authorizationHeader);
  if (!accessToken) {
    reply.status(401).send({ error: "Authorization is required." });
    return null;
  }

  try {
    const user = await authenticateAccessToken(accessToken);
    if (!user) {
      reply.status(401).send({ error: "Authentication failed." });
      return null;
    }

    return user;
  } catch (error) {
    sendInternalServerError(server, reply, error);
    return null;
  }
}

export function sendInternalServerError(
  server: FastifyInstance,
  reply: FastifyReply,
  error: unknown,
) {
  logServerError(server, error);
  return reply.status(500).send({
    error: error instanceof Error ? error.message : "Unexpected server error.",
  });
}

function logServerError(server: FastifyInstance, error: unknown) {
  if (error instanceof Error) {
    server.log.error(error);
    return;
  }

  server.log.error({ error }, "Unexpected server error");
}
