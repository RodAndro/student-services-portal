/**
 * Error normalisation.
 *
 * The backend always answers failures with `{ success: false, message }` (plus
 * `errors` on 422). Axios wraps those in its own error object, so this module
 * converts anything thrown by a request into one predictable shape that the UI
 * can render without knowing about axios.
 */

import axios from "axios";
import type { ApiErrorBody } from "../types/api";

export interface ApiError {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  /** Message taken from the API envelope (safe to show to the user). */
  message: string;
  /** Field-level messages from a 422 response. */
  fieldErrors?: Record<string, string[]>;
}

export const NETWORK_ERROR_MESSAGE =
  "Cannot reach the API. Make sure the Laravel server is running (php artisan serve) on http://127.0.0.1:8000.";

export const UNEXPECTED_RESPONSE_MESSAGE =
  "The server returned a response that did not match the API format. The request may have been intercepted by a proxy or the wrong URL.";

/**
 * True when a successful response body is the envelope every endpoint uses:
 * `{ success: boolean, ... }`.
 *
 * Without this check a 200 carrying something else (an HTML page from a proxy, for
 * example) would be passed to the screen as if it were data, and the UI would render
 * `undefined` fields instead of reporting a problem.
 */
export function isApiEnvelope(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return typeof (value as { success?: unknown }).success === "boolean";
}

/** The ApiError used when a response is not in the expected format. */
export function unexpectedResponseError(status: number): ApiError {
  // The API itself always answers with the envelope, even for a 500 ("Server error.").
  // A 5xx without one therefore did not come from the API: the Vite dev proxy answers
  // 502 (empty body) when `php artisan serve` is not running, and a reverse proxy does
  // the same when the backend is down. That is a connectivity problem, not a data
  // problem, so report it as one.
  if (status >= 500) {
    return {
      status,
      message: `${NETWORK_ERROR_MESSAGE} (The request returned HTTP ${status} with no API response.)`
    };
  }

  return { status, message: UNEXPECTED_RESPONSE_MESSAGE };
}

/** Fallback text when the API sends no message for a status code. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "The request was malformed.",
  401: "Your session has expired. Please sign in again.",
  403: "You are not allowed to perform this action.",
  404: "The requested record was not found.",
  405: "That action is not allowed here.",
  409: "The request conflicts with the current state of the data.",
  422: "Please correct the highlighted fields.",
  429: "Too many requests. Please slow down.",
  500: "The server could not complete the request."
};

export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // An axios error also has numeric `status` and string `message`, so it would
  // otherwise be mistaken for an already-normalised ApiError - and its message is
  // axios's own ("Request failed"), not the one the API sent.
  if ((value as { isAxiosError?: unknown }).isAxiosError === true) {
    return false;
  }

  const candidate = value as Partial<ApiError>;
  return typeof candidate.status === "number" && typeof candidate.message === "string";
}

/** Turn any thrown value into an `ApiError`. Never throws. */
export function toApiError(error: unknown): ApiError {
  // Raw axios failures are handled before the generic check above, so the API's
  // own message always wins.
  if (axios.isAxiosError(error)) {
    const response = error.response;

    // No response => the request never completed (server down, wrong port, timeout).
    if (!response) {
      return { status: 0, message: NETWORK_ERROR_MESSAGE };
    }

    const body = response.data as ApiErrorBody | undefined;
    const message =
      body && typeof body.message === "string" && body.message.length > 0
        ? body.message
        : (STATUS_MESSAGES[response.status] ?? "Something went wrong.");

    const apiError: ApiError = { status: response.status, message };

    if (body?.errors) {
      apiError.fieldErrors = body.errors;
    }

    return apiError;
  }

  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }

  return { status: 0, message: "An unexpected error occurred." };
}

/** Human readable label for a status code, used in the error screens. */
export function errorTitle(status: number): string {
  switch (status) {
    case 0:
      return "Cannot reach the API";
    case 401:
      return "Session expired";
    case 403:
      return "Not allowed";
    case 404:
      return "Not found";
    case 409:
      return "Conflict";
    case 422:
      return "Check the form";
    case 500:
      return "Server error";
    // Gateway codes come from a proxy in front of an unreachable API.
    case 502:
    case 503:
    case 504:
      return "Cannot reach the API";
    default:
      return "Something went wrong";
  }
}
