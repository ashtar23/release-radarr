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
