import { buildQuery } from "../lib/query";
import { http } from "../lib/http";
import type {
  ApiSuccess,
  Grade,
  GradeListParams,
  GradePayload,
  Paginated,
  UpdatePayload
} from "../types/api";

/**
 * /grades - verified against GradeController.
 * There is no `search` parameter and, importantly, **no DELETE endpoint**:
 * grades are corrected by updating them, so the UI must not offer a delete action.
 */
const QUERY_KEYS: readonly string[] = ["sort", "direction", "enrollment_id", "page", "per_page"];

export const GRADE_SORT_FIELDS: readonly string[] = [
  "midterm_grade",
  "final_grade",
  "created_at",
  "id"
];

/** The backend validates both grades with `min:0|max:100`. */
export const GRADE_MIN = 0;
export const GRADE_MAX = 100;

export function listGrades(params: GradeListParams = {}): Promise<Paginated<Grade>> {
  return http
    .get<Paginated<Grade>>("/grades", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getGrade(id: number): Promise<ApiSuccess<Grade>> {
  return http.get<ApiSuccess<Grade>>(`/grades/${id}`).then((response) => response.data);
}

/** One grade per enrollment - returns 409 when the enrollment already has one. */
export function createGrade(payload: GradePayload): Promise<ApiSuccess<Grade>> {
  return http.post<ApiSuccess<Grade>>("/grades", payload).then((response) => response.data);
}

export function updateGrade(
  id: number,
  payload: UpdatePayload<Omit<GradePayload, "enrollment_id">>
): Promise<ApiSuccess<Grade>> {
  return http.put<ApiSuccess<Grade>>(`/grades/${id}`, payload).then((response) => response.data);
}
