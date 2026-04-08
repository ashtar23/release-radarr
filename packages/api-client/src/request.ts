import type { HttpMethod } from "./errors";
import { buildAuthHeaders, resolveAccessToken } from "./auth";
import { ApiClientError } from "./errors";

const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

export interface RequestContext {
  readonly baseUrl: string;
  readonly publishableKey: string;
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  readonly onUnauthorized?: () => Promise<boolean> | boolean;
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
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const accessToken = await resolveAccessToken(context.getAccessToken);
    const requestSignal = createRequestSignal(signal);
    const response = await fetchWithRequestSignal({
      fetchFn,
      url: `${context.baseUrl}${path}`,
      init: {
        method,
        headers: {
          ...buildAuthHeaders(context.publishableKey, accessToken),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
        signal: requestSignal.signal,
      },
      requestSignal,
      method,
      path,
      failureMessage,
      sourceSignal: signal,
    });

    if (response.status === 401 && attempt === 0 && context.onUnauthorized) {
      const shouldRetry = await context.onUnauthorized();
      if (shouldRetry) {
        continue;
      }
    }

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

  throw new ApiClientError({
    message: failureMessage,
    status: 401,
    method,
    path,
  });
}

export async function requestVoid({
  context,
  method,
  path,
  signal,
  failureMessage,
}: RequestVoidParams): Promise<void> {
  const fetchFn = context.fetchFn;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const accessToken = await resolveAccessToken(context.getAccessToken);
    const requestSignal = createRequestSignal(signal);
    const response = await fetchWithRequestSignal({
      fetchFn,
      url: `${context.baseUrl}${path}`,
      init: {
        method,
        headers: buildAuthHeaders(context.publishableKey, accessToken),
        signal: requestSignal.signal,
      },
      requestSignal,
      method,
      path,
      failureMessage,
      sourceSignal: signal,
    });

    if (response.status === 401 && attempt === 0 && context.onUnauthorized) {
      const shouldRetry = await context.onUnauthorized();
      if (shouldRetry) {
        continue;
      }
    }

    if (!response.ok) {
      throw await toApiClientError({
        response,
        method,
        path,
        fallbackMessage: failureMessage,
      });
    }

    return;
  }

  throw new ApiClientError({
    message: failureMessage,
    status: 401,
    method,
    path,
  });
}

async function fetchWithRequestSignal({
  fetchFn,
  url,
  init,
  requestSignal,
  method,
  path,
  failureMessage,
  sourceSignal,
}: {
  readonly fetchFn: typeof fetch;
  readonly url: string;
  readonly init: RequestInit;
  readonly requestSignal: ReturnType<typeof createRequestSignal>;
  readonly method: HttpMethod;
  readonly path: string;
  readonly failureMessage: string;
  readonly sourceSignal?: AbortSignal;
}) {
  try {
    return await fetchFn(url, init);
  } catch (error) {
    throw toTransportError({
      error,
      method,
      path,
      fallbackMessage: failureMessage,
      didTimeout: requestSignal.didTimeout(),
      wasCancelled: sourceSignal?.aborted === true,
    });
  } finally {
    requestSignal.cleanup();
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

  if (
    typeof payload.message === "string" &&
    payload.message.trim().length > 0
  ) {
    return payload.message;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createRequestSignal(sourceSignal?: AbortSignal) {
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, DEFAULT_REQUEST_TIMEOUT_MS);

  const abortFromSource = () => {
    controller.abort();
  };

  if (sourceSignal) {
    if (sourceSignal.aborted) {
      abortFromSource();
    } else {
      sourceSignal.addEventListener("abort", abortFromSource, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => didTimeout,
    cleanup() {
      clearTimeout(timeoutId);
      sourceSignal?.removeEventListener("abort", abortFromSource);
    },
  };
}

function toTransportError({
  error,
  method,
  path,
  fallbackMessage,
  didTimeout,
  wasCancelled,
}: {
  error: unknown;
  method: HttpMethod;
  path: string;
  fallbackMessage: string;
  didTimeout: boolean;
  wasCancelled: boolean;
}) {
  if (didTimeout) {
    return new ApiClientError({
      message: `${fallbackMessage} Request timed out. Check your internet connection and try again.`,
      status: 408,
      method,
      path,
    });
  }

  if (wasCancelled || isAbortError(error)) {
    return error;
  }

  return new ApiClientError({
    message: `${fallbackMessage} Check your internet connection and try again.`,
    status: 0,
    method,
    path,
  });
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
