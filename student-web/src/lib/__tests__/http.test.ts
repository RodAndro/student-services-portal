import { AxiosError } from "axios";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_RESPONSE_MESSAGE } from "../errors";
import { http, setUnauthorizedHandler } from "../http";

const originalAdapter = http.defaults.adapter;

/** Builds an adapter that always answers with the given status and body. */
function respondWith(status: number, data: unknown): AxiosAdapter {
  return (async (config: InternalAxiosRequestConfig) =>
    ({
      status,
      statusText: "",
      data,
      headers: {},
      config
    }) as AxiosResponse) as AxiosAdapter;
}

/** Builds an adapter that fails the way axios reports a real transport failure. */
function failWith(error: unknown): AxiosAdapter {
  return (async () => {
    throw error;
  }) as AxiosAdapter;
}

describe("http interceptor", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    http.defaults.adapter = originalAdapter;
    setUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  it("resolves normally when the body is the API envelope", async () => {
    http.defaults.adapter = respondWith(200, {
      success: true,
      message: "Students retrieved successfully.",
      data: []
    });

    const response = await http.get("/students");

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it("rejects an HTML page returned with a 200 instead of the envelope", async () => {
    // What a misconfigured proxy or wrong base URL would produce.
    http.defaults.adapter = respondWith(
      200,
      "<!doctype html><html><body>Not the API</body></html>"
    );

    await expect(http.get("/students")).rejects.toMatchObject({
      status: 200,
      message: UNEXPECTED_RESPONSE_MESSAGE
    });
  });

  it("reports a bodyless 502 from a proxy as an unreachable API", async () => {
    // Measured against the real stack: Vite's dev proxy answers 502 with an empty body
    // while `php artisan serve` is stopped.
    http.defaults.adapter = respondWith(502, "");

    await expect(http.get("/students")).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("Cannot reach the API")
    });

    await expect(http.get("/students")).rejects.toMatchObject({
      message: expect.stringContaining("HTTP 502")
    });
  });

  it("rejects a JSON body that is not the envelope", async () => {
    http.defaults.adapter = respondWith(200, [{ id: 1 }]);

    await expect(http.get("/students")).rejects.toMatchObject({
      status: 200,
      message: UNEXPECTED_RESPONSE_MESSAGE
    });
  });

  it("normalises an error response to the API's own message", async () => {
    const response = {
      status: 409,
      statusText: "",
      data: {
        success: false,
        message: "Cannot delete this program because students are assigned to it."
      },
      headers: {},
      config: {}
    } as AxiosResponse;

    http.defaults.adapter = failWith(
      new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response)
    );

    await expect(http.get("/programs/1")).rejects.toMatchObject({
      status: 409,
      message: "Cannot delete this program because students are assigned to it."
    });
  });

  it("calls the unauthorized handler for a 401", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    const response = {
      status: 401,
      statusText: "",
      data: { success: false, message: "Unauthenticated." },
      headers: {},
      config: {}
    } as AxiosResponse;

    http.defaults.adapter = failWith(
      new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response)
    );

    await expect(http.get("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("maps a transport failure to status 0 with the 'is the server running' hint", async () => {
    http.defaults.adapter = failWith(new AxiosError("Network Error", "ERR_NETWORK"));

    await expect(http.get("/students")).rejects.toMatchObject({
      status: 0,
      message: NETWORK_ERROR_MESSAGE
    });
  });

  it("maps a timeout to status 0 as well", async () => {
    // What axios reports when the request exceeds API_REQUEST_TIMEOUT_MS.
    http.defaults.adapter = failWith(new AxiosError("timeout of 20000ms exceeded", "ECONNABORTED"));

    await expect(http.get("/students")).rejects.toMatchObject({
      status: 0,
      message: NETWORK_ERROR_MESSAGE
    });
  });
});
