/**
 * An HTTP-boundary test double.
 *
 * These tests mock the *network*, not the application. Swapping
 * `http.defaults.adapter` means the api modules, the interceptors, the hooks and the
 * components all run exactly as they do in the browser: the URL, the query
 * parameters, the request body, the Authorization header and the error normalisation
 * are the real code. That is why assertions here can check the parameters that would
 * have gone over the wire instead of only what is on screen.
 *
 * Usage:
 *   const api = installMockApi([{ method: "get", path: "/students", reply: () => ({ body }) }]);
 *   ...
 *   expect(api.last("get", "/students")?.params).toMatchObject({ search: "cruz" });
 *
 * `restoreMockApi()` runs after every test (see src/test/setup.ts).
 */

import { AxiosError } from "axios";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { http } from "../lib/http";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** A request the application really made. */
export interface RecordedRequest {
  method: HttpMethod;
  /** Path after the base URL, e.g. "/students/12". Query string excluded. */
  path: string;
  /** Query parameters the api layer built for this call. */
  params: Record<string, unknown>;
  /** Parsed JSON body (undefined for GET/DELETE). */
  body: unknown;
  /** Value of the Authorization header the interceptor attached. */
  authorization: string | undefined;
}

export interface MockReply {
  /** Defaults to 200. */
  status?: number;
  /** Response body; defaults to an empty success envelope. */
  body?: unknown;
  /** Simulate a transport failure (the request never reached the server). */
  network?: boolean;
  /** Error code used with `network`, e.g. "ECONNABORTED" for a timeout. */
  code?: string;
}

export interface MockRoute {
  method: HttpMethod;
  /** "/students", "/students/:id", or a RegExp tested against the path. */
  path: string | RegExp;
  /** Return a reply, or a promise when the test needs to control the timing. */
  reply: (request: RecordedRequest) => MockReply | Promise<MockReply>;
}

export interface MockApi {
  requests: RecordedRequest[];
  /** Every call to a path, in order. */
  all(method: HttpMethod, pathPrefix: string): RecordedRequest[];
  /** The most recent call to a path (throws if there was none). */
  last(method: HttpMethod, pathPrefix: string): RecordedRequest;
}

/** `{ success: true, message, data }` - the envelope every endpoint uses. */
export function envelope<T>(data: T, message = "OK"): { success: true; message: string; data: T } {
  return { success: true, message, data };
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/** Pagination metadata as the API sends it, with sensible arithmetic defaults. */
export function metaOf(count: number, overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  const perPage = overrides.per_page ?? 15;

  return {
    current_page: 1,
    per_page: perPage,
    total: count,
    last_page: Math.max(1, Math.ceil(count / perPage)),
    from: count === 0 ? null : 1,
    to: count === 0 ? null : count,
    ...overrides
  };
}

/** A paginated collection response. */
export function paginated<T>(
  data: T[],
  overrides: Partial<PaginationMeta> = {},
  message = "Retrieved successfully."
) {
  return {
    success: true as const,
    message,
    data,
    meta: metaOf(data.length, overrides)
  };
}

/** A failure response in the shape the API uses (422 also carries `errors`). */
export function failure(message: string, errors?: Record<string, string[]>) {
  return { success: false as const, message, ...(errors ? { errors } : {}) };
}

function toPattern(path: string | RegExp): RegExp {
  if (path instanceof RegExp) {
    return path;
  }

  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/:(\w+)/g, "([^/]+)")}$`);
}

function pathOf(config: InternalAxiosRequestConfig): string {
  const raw = config.url ?? "";
  const base = config.baseURL ?? "";
  const withoutBase = base && raw.startsWith(base) ? raw.slice(base.length) : raw;
  const [withoutQuery] = withoutBase.split("?");

  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

function axiosError(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosError {
  const response = {
    status,
    statusText: "",
    data: body,
    headers: {},
    config
  } as AxiosResponse;

  return new AxiosError(
    `Request failed with status code ${status}`,
    "ERR_BAD_REQUEST",
    config,
    undefined,
    response
  );
}

let originalAdapter: typeof http.defaults.adapter;
let installed = false;

/** Installs the routing adapter. Replaces any adapter installed by a previous test. */
export function installMockApi(routes: MockRoute[]): MockApi {
  if (!installed) {
    originalAdapter = http.defaults.adapter;
    installed = true;
  }

  const requests: RecordedRequest[] = [];

  http.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? "get").toLowerCase() as HttpMethod;
    const path = pathOf(config);

    const request: RecordedRequest = {
      method,
      path,
      params: (config.params ?? {}) as Record<string, unknown>,
      body:
        typeof config.data === "string"
          ? (JSON.parse(config.data) as unknown)
          : (config.data as unknown),
      authorization: (config.headers?.Authorization as string | undefined) ?? undefined
    };

    requests.push(request);

    const route = routes.find(
      (candidate) => candidate.method === method && toPattern(candidate.path).test(path)
    );

    if (!route) {
      // Loud on purpose: a missing route means the application called an endpoint the
      // test forgot to mock, and that should never pass quietly.
      throw new Error(`No mock route for ${method.toUpperCase()} ${path}`);
    }

    const reply = await route.reply(request);

    if (reply.network) {
      throw new AxiosError("Network Error", reply.code ?? "ERR_NETWORK", config);
    }

    const status = reply.status ?? 200;
    const body = reply.body ?? envelope(null);

    if (status >= 400) {
      throw axiosError(config, status, body);
    }

    return { status, statusText: "", data: body, headers: {}, config } as AxiosResponse;
  }) as AxiosAdapter;

  return {
    requests,
    all(method, pathPrefix) {
      return requests.filter((item) => item.method === method && item.path.startsWith(pathPrefix));
    },
    last(method, pathPrefix) {
      const matches = requests.filter(
        (item) => item.method === method && item.path.startsWith(pathPrefix)
      );
      const newest = matches.at(-1);

      if (!newest) {
        throw new Error(
          `No ${method.toUpperCase()} ${pathPrefix} request was made. Recorded: ${
            requests.map((item) => `${item.method.toUpperCase()} ${item.path}`).join(", ") ||
            "(none)"
          }`
        );
      }

      return newest;
    }
  };
}

/** Puts the real adapter back. Called after every test from src/test/setup.ts. */
export function restoreMockApi(): void {
  if (!installed) {
    return;
  }

  http.defaults.adapter = originalAdapter;
  installed = false;
}
