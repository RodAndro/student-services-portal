import { http } from "../lib/http";
import type { ApiSuccess, PingResult } from "../types/api";

/** GET /ping - public smoke-test endpoint (no token required). */
export function ping(): Promise<ApiSuccess<PingResult>> {
  return http.get<ApiSuccess<PingResult>>("/ping").then((response) => response.data);
}
