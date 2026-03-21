import type { HttpMethod } from "./errors";
import { buildAuthHeaders, resolveAccessToken } from "./auth";
import { ApiClientError } from "./errors";

export interface RequestContext {
  readonly baseUrl: string;
  readonly publishableKey: string;
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  readonly fetchFn: typeof fetch;
}

interface RequestJsonParams<T> {
  readonly context: RequestContext;
  readonly method: HttpMethod;
  readonly path: string;
  readonly signal?: AbortSignal;
  readonly body?: string;
  readonly validate: (value: unknown) => value is T;
  readonly invalidPayloadMessage: string;
  readonly failureMessage: string;
}

interface RequestVoidParams {
  readonly context: RequestContext;
  readonly method: HttpMethod;
  readonly path: string;
  readonly signal?: AbortSignal;
  readonly failureMessage: string;
}

export async function requestJson<T>({
  context,
  method,
  path,
  signal,
  body,
  validate,
  invalidPayloadMessage,
  failureMessage,
}: RequestJsonParams<T>): Promise<T> {
  const fetchFn = context.fetchFn;
  const accessToken = await resolveAccessToken(
    context.publishableKey,
    context.getAccessToken,
  );
  const response = await fetchFn(`${context.baseUrl}${path}`, {
    method,
    headers: {
      ...buildAuthHeaders(context.publishableKey, accessToken),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    signal,
  });

  if (!response.ok) {
    throw await toApiClientError({
      response,
      method,
      path,
      fallbackMessage: failureMessage,
    });
  }

  const payload: unknown = await response.json();
  if (!validate(payload)) {
    throw new ApiClientError({
      message: invalidPayloadMessage,
      status: response.status,
      method,
      path,
    });
  }

  return payload;
}

export async function requestVoid({
  context,
  method,
  path,
  signal,
  failureMessage,
}: RequestVoidParams): Promise<void> {
  const fetchFn = context.fetchFn;
  const accessToken = await resolveAccessToken(
    context.publishableKey,
    context.getAccessToken,
  );
  const response = await fetchFn(`${context.baseUrl}${path}`, {
    method,
    headers: buildAuthHeaders(context.publishableKey, accessToken),
    signal,
  });

  if (!response.ok) {
    throw await toApiClientError({
      response,
      method,
      path,
      fallbackMessage: failureMessage,
    });
  }
}

async function toApiClientError(params: {
  readonly response: Response;
  readonly method: HttpMethod;
  readonly path: string;
  readonly fallbackMessage: string;
}) {
  const detailMessage = await readErrorMessage(params.response);
  return new ApiClientError({
    status: params.response.status,
    method: params.method,
    path: params.path,
    message:
      detailMessage ??
      `${params.fallbackMessage} (status: ${params.response.status}).`,
  });
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
