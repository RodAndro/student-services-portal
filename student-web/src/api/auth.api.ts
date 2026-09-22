import { http } from "../lib/http";
import type { ApiSuccess, AuthUser, LoginPayload, LoginResult } from "../types/api";

/**
 * Authentication endpoints.
 * These are the only endpoints that return a plaintext token, and it is returned
 * exactly once - the server stores only a hash of it.
 */

/** POST /auth/login - exchange credentials for a Sanctum bearer token. */
export function login(payload: LoginPayload): Promise<ApiSuccess<LoginResult>> {
  return http
    .post<ApiSuccess<LoginResult>>("/auth/login", payload)
    .then((response) => response.data);
}

/** GET /auth/me - the authenticated user (used to rehydrate the session). */
export function me(): Promise<ApiSuccess<AuthUser>> {
  return http.get<ApiSuccess<AuthUser>>("/auth/me").then((response) => response.data);
}

/** POST /auth/logout - revokes the token used for this request. */
export function logout(): Promise<ApiSuccess<null>> {
  return http.post<ApiSuccess<null>>("/auth/logout").then((response) => response.data);
}
