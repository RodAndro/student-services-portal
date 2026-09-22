import { buildQuery } from "../lib/query";
import { http } from "../lib/http";
import type {
  ApiSuccess,
  Enrollment,
  EnrollmentListParams,
  EnrollmentPayload,
  Paginated,
  UpdatePayload
} from "../types/api";

/**
 * /enrollments - verified against EnrollmentController.
 * There is no `search` parameter and no nested create route: enrolling posts the
 * student id and the offering id in the body.
 */
const QUERY_KEYS: readonly string[] = [
  "sort",
  "direction",
  "student_id",
  "course_offering_id",
  "status",
  "page",
  "per_page"
];

export const ENROLLMENT_SORT_FIELDS: readonly string[] = ["enrollment_date", "status", "id"];
export const ENROLLMENT_STATUSES: readonly string[] = ["ENROLLED", "DROPPED", "COMPLETED"];

export function listEnrollments(params: EnrollmentListParams = {}): Promise<Paginated<Enrollment>> {
  return http
    .get<Paginated<Enrollment>>("/enrollments", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getEnrollment(id: number): Promise<ApiSuccess<Enrollment>> {
  return http.get<ApiSuccess<Enrollment>>(`/enrollments/${id}`).then((response) => response.data);
}

/** Returns 409 when the student is already enrolled or the offering is full. */
export function createEnrollment(payload: EnrollmentPayload): Promise<ApiSuccess<Enrollment>> {
  return http
    .post<ApiSuccess<Enrollment>>("/enrollments", payload)
    .then((response) => response.data);
}

export function updateEnrollment(
  id: number,
  payload: UpdatePayload<EnrollmentPayload>
): Promise<ApiSuccess<Enrollment>> {
  return http
    .patch<ApiSuccess<Enrollment>>(`/enrollments/${id}`, payload)
    .then((response) => response.data);
}

export function deleteEnrollment(id: number): Promise<ApiSuccess<null>> {
  return http.delete<ApiSuccess<null>>(`/enrollments/${id}`).then((response) => response.data);
}
