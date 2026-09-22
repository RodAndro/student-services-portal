/**
 * The single axios instance used by every API module.
 *
 * Responsibilities kept in one place:
 *  - base URL (from the environment, configurable)
 *  - the Authorization header (from the stored token)
 *  - turning every failure into an `ApiError`
 *  - a single hook for "the API says 401" so the auth layer can log the user out
 */

import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, API_REQUEST_TIMEOUT_MS } from "../config/env";
import { isApiEnvelope, toApiError, unexpectedResponseError } from "./errors";
import { getToken } from "./storage";

let unauthorizedHandler: (() => void) | null = null;

/**
 * Registered by the auth layer (Phase 2). Called whenever any request comes back
 * with 401, so an expired or revoked token clears the session exactly once.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json"
  }
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response: AxiosResponse) => {
    // Every endpoint answers with `{ success, message, data }`. If a success response
    // is anything else - an HTML page returned by a proxy, the wrong base URL, an
    // intercepted request - reject it as an ApiError instead of handing the screen a
    // body it will render as undefined fields.
    if (!isApiEnvelope(response.data)) {
      return Promise.reject(unexpectedResponseError(response.status));
    }

    return response;
  },
  (error: AxiosError) => {
    const apiError = toApiError(error);

    if (apiError.status === 401) {
      unauthorizedHandler?.();
    }

    // Reject with the normalised error so callers never see an axios object.
    return Promise.reject(apiError);
  }
);
