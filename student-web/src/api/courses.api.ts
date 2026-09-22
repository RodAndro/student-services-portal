import { http } from "../lib/http";
import { buildQuery } from "../lib/query";
import type {
  ActiveStatus,
  ApiSuccess,
  Course,
  CourseListParams,
  CoursePayload,
  Paginated,
  UpdatePayload
} from "../types/api";

/**
 * /courses - verified against CourseController + Store/UpdateCourseRequest:
 *
 *   GET    /courses              list (search, status, sort, direction, page, per_page)
 *   POST   /courses              create
 *   GET    /courses/{id}         show
 *   PUT    /courses/{id}         update (partial allowed)
 *   DELETE /courses/{id}         delete - 409 when course offerings exist
 */
const QUERY_KEYS: readonly string[] = ["search", "sort", "direction", "status", "page", "per_page"];

/** Sortable columns, exactly as declared by the controller. */
export const COURSE_SORT_FIELDS: readonly string[] = [
  "course_code",
  "course_title",
  "units",
  "created_at",
  "id"
];

export const COURSE_STATUSES: readonly ActiveStatus[] = ["ACTIVE", "INACTIVE"];

/** The backend validates units with `min:1|max:12`. */
export const COURSE_UNITS_MIN = 1;
export const COURSE_UNITS_MAX = 12;

export function listCourses(params: CourseListParams = {}): Promise<Paginated<Course>> {
  return http
    .get<Paginated<Course>>("/courses", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getCourse(id: number): Promise<ApiSuccess<Course>> {
  return http.get<ApiSuccess<Course>>(`/courses/${id}`).then((response) => response.data);
}

export function createCourse(payload: CoursePayload): Promise<ApiSuccess<Course>> {
  return http.post<ApiSuccess<Course>>("/courses", payload).then((response) => response.data);
}

export function updateCourse(
  id: number,
  payload: UpdatePayload<CoursePayload>
): Promise<ApiSuccess<Course>> {
  return http.put<ApiSuccess<Course>>(`/courses/${id}`, payload).then((response) => response.data);
}

export function deleteCourse(id: number): Promise<ApiSuccess<null>> {
  return http.delete<ApiSuccess<null>>(`/courses/${id}`).then((response) => response.data);
}
