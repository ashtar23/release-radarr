export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiClientErrorOptions {
  readonly message: string;
  readonly status: number;
  readonly method: HttpMethod;
  readonly path: string;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly method: HttpMethod;
  readonly path: string;

  constructor({ message, status, method, path }: ApiClientErrorOptions) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.method = method;
    this.path = path;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (isApiClientError(error)) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (isRecordWithString(error, "message")) {
    return error.message;
  }

  if (isNestedErrorArray(error)) {
    return error.response.data.errors[0]?.title ?? fallback;
  }

  if (
    isRecord(error) &&
    isRecord(error.response) &&
    isRecordWithString(error.response.data, "message")
  ) {
    return error.response.data.message;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecordWithString<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, string> {
  return isRecord(value) && typeof value[key] === "string";
}

function isNestedErrorArray(
  value: unknown,
): value is {
  response: {
    data: {
      errors: Array<{ title?: string }>;
    };
  };
} {
  if (!isRecord(value) || !isRecord(value.response) || !isRecord(value.response.data)) {
    return false;
  }

  const errors = value.response.data.errors;
  return (
    Array.isArray(errors) &&
    errors.every((item) => isRecord(item) && ("title" in item ? typeof item.title === "string" || item.title === undefined : true))
  );
}
