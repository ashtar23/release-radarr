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

interface RequestJsonBaseParams {
  readonly context: RequestContext;
  readonly method: HttpMethod;
  readonly path: string;
  readonly signal?: AbortSignal;
  readonly body?: string;
  readonly failureMessage: string;
}

interface RequestJsonValidatedParams<T> extends RequestJsonBaseParams {
  readonly validate: (value: unknown) => value is T;
  readonly invalidPayloadMessage: string;
}

interface RequestJsonTrustedParams extends RequestJsonBaseParams {
  readonly validate?: undefined;
  readonly invalidPayloadMessage?: undefined;
}

interface RequestVoidParams {
  readonly context: RequestContext;
  readonly method: HttpMethod;
  readonly path: string;
  readonly signal?: AbortSignal;
  readonly failureMessage: string;
}

interface RequestResponseParams {
  readonly context: RequestContext;
  readonly method: HttpMethod;
  readonly path: string;
  readonly signal?: AbortSignal;
  readonly body?: BodyInit;
  readonly headers?: HeadersInit;
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
}: RequestJsonValidatedParams<T> | RequestJsonTrustedParams): Promise<T> {
  const response = await requestResponse({
    context,
    method,
    path,
    signal,
    body,
    failureMessage,
  });

  const payload: unknown = await response.json();
  if (validate) {
    if (!validate(payload)) {
      throw new ApiClientError({
        message: invalidPayloadMessage,
        status: response.status,
        method,
        path,
      });
    }
  }

  return payload as T;
}

export async function requestVoid({
  context,
  method,
  path,
  signal,
  failureMessage,
}: RequestVoidParams): Promise<void> {
  await requestResponse({
    context,
    method,
    path,
    signal,
    failureMessage,
  });
}

export async function requestResponse({
  context,
  method,
  path,
  signal,
  body,
  headers,
  failureMessage,
}: RequestResponseParams): Promise<Response> {
  const fetchFn = context.fetchFn;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const accessToken = await resolveAccessToken(context.getAccessToken);
    const requestSignal = createRequestSignal(signal);
    const response = await fetchWithRequestSignal({
      fetchFn,
      url: `${context.baseUrl}${path}`,
      init: {
        method,
        headers: mergeRequestHeaders({
          publishableKey: context.publishableKey,
          accessToken,
          headers,
          body,
        }),
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

    return response;
  }

  throw new ApiClientError({
    message: failureMessage,
    status: 401,
    method,
    path,
  });
}

export function createContextFetch(context: RequestContext): typeof fetch {
  return async (input, init) => {
    const normalizedRequest = normalizeFetchRequest(input, init);

    return requestResponse({
      context,
      method: normalizedRequest.method,
      path: normalizedRequest.path,
      signal: normalizedRequest.signal,
      body: normalizedRequest.body,
      headers: normalizedRequest.headers,
      failureMessage: `${normalizedRequest.method} ${normalizedRequest.path} request failed.`,
    });
  };
}

export async function toApiClientErrorFromResponse(params: {
  readonly response: Response;
  readonly method: HttpMethod;
  readonly path: string;
  readonly failureMessage: string;
}) {
  return toApiClientError({
    response: params.response,
    method: params.method,
    path: params.path,
    fallbackMessage: params.failureMessage,
  });
}

function normalizeFetchRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): {
  readonly method: HttpMethod;
  readonly path: string;
  readonly signal?: AbortSignal;
  readonly body?: BodyInit;
  readonly headers: Headers;
} {
  const request = input instanceof Request ? input : null;

  const url = resolveRequestUrl(input);
  return {
    method: normalizeHttpMethod(init?.method ?? request?.method),
    path: toRequestPath(url),
    signal: init?.signal ?? request?.signal ?? undefined,
    body: init?.body ?? request?.body ?? undefined,
    headers: mergeHeaders(request?.headers, init?.headers),
  };
}

function resolveRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function toRequestPath(url: string) {
  const parsedUrl = new URL(url);
  return `${parsedUrl.pathname}${parsedUrl.search}`;
}

function normalizeHttpMethod(value: string | undefined): HttpMethod {
  switch ((value ?? "GET").toUpperCase()) {
    case "DELETE":
      return "DELETE";
    case "POST":
      return "POST";
    case "PUT":
      return "PUT";
    default:
      return "GET";
  }
}

function mergeRequestHeaders(params: {
  readonly publishableKey: string;
  readonly accessToken: string | null;
  readonly headers?: HeadersInit;
  readonly body?: BodyInit;
}) {
  const headers = mergeHeaders(params.headers);

  for (const [key, value] of Object.entries(
    buildAuthHeaders(params.publishableKey, params.accessToken),
  )) {
    headers.set(key, value);
  }

  if (typeof params.body === "string" && !headers.has("content-type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function mergeHeaders(...values: Array<HeadersInit | undefined>) {
  const headers = new Headers();

  for (const value of values) {
    if (!value) {
      continue;
    }

    new Headers(value).forEach((headerValue, key) => {
      headers.set(key, headerValue);
    });
  }

  return headers;
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
