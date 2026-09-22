import type { ApiSuccess } from "../types/api";

/**
 * Single-resource endpoints return the full `{ success, message, data }` envelope
 * so the caller can show the server's own message (used for toasts). Most screens
 * only want the payload, so `unwrap` keeps them readable:
 *
 *   const program = await programsApi.getProgram(id).then(unwrap);
 */
export function unwrap<T>(envelope: ApiSuccess<T>): T {
  return envelope.data;
}
