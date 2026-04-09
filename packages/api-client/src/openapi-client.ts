import type { paths } from "./generated/openapi";
import { requestJson, requestVoid, type RequestContext } from "./request";

type OpenApiMethod = "get" | "post" | "put" | "delete";

type PathsWithMethod<Method extends OpenApiMethod> = {
  [Path in keyof paths]: paths[Path][Method] extends undefined | never
    ? never
    : Path;
}[keyof paths];

type OperationFor<
  Path extends keyof paths,
  Method extends OpenApiMethod,
> = NonNullable<paths[Path][Method]>;

type QueryParamsFor<Path extends keyof paths, Method extends OpenApiMethod> =
  OperationFor<Path, Method> extends {
    parameters: infer Parameters;
  }
    ? Parameters extends { query?: infer Query }
      ? Query
      : never
    : never;

type PathParamsFor<Path extends keyof paths, Method extends OpenApiMethod> =
  OperationFor<Path, Method> extends {
    parameters: infer Parameters;
  }
    ? Parameters extends { path?: infer PathParameters }
      ? PathParameters
      : never
    : never;

type JsonBodyFor<Path extends keyof paths, Method extends OpenApiMethod> =
  OperationFor<Path, Method> extends {
    requestBody: {
      content: {
        "application/json": infer Body;
      };
    };
  }
    ? Body
    : never;

type JsonContentOf<Response> = Response extends {
  content: {
    "application/json": infer Content;
  };
}
  ? Content
  : never;

type SuccessResponseFor<
  Path extends keyof paths,
  Method extends OpenApiMethod,
> = OperationFor<Path, Method>["responses"] extends infer Responses
  ? Responses extends Record<PropertyKey, unknown>
    ? 200 extends keyof Responses
      ? JsonContentOf<Responses[200]>
      : 201 extends keyof Responses
        ? JsonContentOf<Responses[201]>
        : never
    : never
  : never;

interface OpenApiRequestBase<
  Path extends keyof paths,
  Method extends OpenApiMethod,
> {
  readonly context: RequestContext;
  readonly path: Path;
  readonly pathParams?: PathParamsFor<Path, Method>;
  readonly query?: QueryParamsFor<Path, Method>;
  readonly signal?: AbortSignal;
  readonly failureMessage: string;
}

interface OpenApiBodyRequest<
  Path extends keyof paths,
  Method extends OpenApiMethod,
> extends OpenApiRequestBase<Path, Method> {
  readonly body?: JsonBodyFor<Path, Method>;
}

export function openApiGet<Path extends PathsWithMethod<"get">>(
  params: OpenApiRequestBase<Path, "get">,
): Promise<SuccessResponseFor<Path, "get">> {
  return requestJson<SuccessResponseFor<Path, "get">>({
    context: params.context,
    method: "GET",
    path: buildRequestPath(params.path, params.pathParams, params.query),
    signal: params.signal,
    failureMessage: params.failureMessage,
  });
}

export function openApiPost<Path extends PathsWithMethod<"post">>(
  params: OpenApiBodyRequest<Path, "post">,
): Promise<SuccessResponseFor<Path, "post">> {
  return requestJson<SuccessResponseFor<Path, "post">>({
    context: params.context,
    method: "POST",
    path: buildRequestPath(params.path, params.pathParams, params.query),
    signal: params.signal,
    body: params.body === undefined ? undefined : JSON.stringify(params.body),
    failureMessage: params.failureMessage,
  });
}

export function openApiPut<Path extends PathsWithMethod<"put">>(
  params: OpenApiBodyRequest<Path, "put">,
): Promise<SuccessResponseFor<Path, "put">> {
  return requestJson<SuccessResponseFor<Path, "put">>({
    context: params.context,
    method: "PUT",
    path: buildRequestPath(params.path, params.pathParams, params.query),
    signal: params.signal,
    body: params.body === undefined ? undefined : JSON.stringify(params.body),
    failureMessage: params.failureMessage,
  });
}

export function openApiDelete<Path extends PathsWithMethod<"delete">>(
  params: OpenApiRequestBase<Path, "delete">,
): Promise<void> {
  return requestVoid({
    context: params.context,
    method: "DELETE",
    path: buildRequestPath(params.path, params.pathParams, params.query),
    signal: params.signal,
    failureMessage: params.failureMessage,
  });
}

function buildRequestPath(
  path: string,
  pathParams?: Record<string, unknown>,
  query?: Record<string, unknown>,
) {
  const resolvedPath = path.replaceAll(/\{([^}]+)\}/g, (_, key: string) => {
    const value = pathParams?.[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${key} is required.`);
    }

    return encodeURIComponent(value);
  });

  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null) {
        continue;
      }

      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${resolvedPath}?${queryString}` : resolvedPath;
}

export type { JsonBodyFor, PathParamsFor, QueryParamsFor, SuccessResponseFor };
