import { http } from "../lib/http";
import { buildQuery } from "../lib/query";
import type {
  ActiveStatus,
  ApiSuccess,
  Paginated,
  Program,
  ProgramListParams,
  ProgramPayload,
  UpdatePayload
} from "../types/api";

/**
 * /programs - verified against ProgramController + Store/UpdateProgramRequest:
 *
 *   GET    /programs              list (search, status, sort, direction, page, per_page)
 *   POST   /programs              create
 *   GET    /programs/{id}         show
 *   PUT    /programs/{id}         update (partial allowed)
 *   DELETE /programs/{id}         delete - 409 when students are assigned
 *
 * Query parameters are filtered against the backend's allow-list, so the UI can
 * never send a parameter the API ignores.
 */
const QUERY_KEYS: readonly string[] = ["search", "sort", "direction", "status", "page", "per_page"];

/** Sortable columns, exactly as declared by the controller. */
export const PROGRAM_SORT_FIELDS: readonly string[] = ["code", "name", "created_at", "id"];

export const PROGRAM_STATUSES: readonly ActiveStatus[] = ["ACTIVE", "INACTIVE"];

export function listPrograms(params: ProgramListParams = {}): Promise<Paginated<Program>> {
  return http
    .get<Paginated<Program>>("/programs", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getProgram(id: number): Promise<ApiSuccess<Program>> {
  return http.get<ApiSuccess<Program>>(`/programs/${id}`).then((response) => response.data);
}

export function createProgram(payload: ProgramPayload): Promise<ApiSuccess<Program>> {
  return http.post<ApiSuccess<Program>>("/programs", payload).then((response) => response.data);
}

export function updateProgram(
  id: number,
  payload: UpdatePayload<ProgramPayload>
): Promise<ApiSuccess<Program>> {
  return http
    .put<ApiSuccess<Program>>(`/programs/${id}`, payload)
    .then((response) => response.data);
}

export function deleteProgram(id: number): Promise<ApiSuccess<null>> {
  return http.delete<ApiSuccess<null>>(`/programs/${id}`).then((response) => response.data);
}
