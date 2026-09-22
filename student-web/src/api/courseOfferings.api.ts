import { buildQuery, PER_PAGE_DEFAULT } from "../lib/query";
import { http } from "../lib/http";
import type {
  ApiSuccess,
  CourseOffering,
  CourseOfferingListParams,
  CourseOfferingPayload,
  Enrollment,
  Paginated,
  UpdatePayload
} from "../types/api";

/**
 * /course-offerings - verified against CourseOfferingController.
 * Instructors are scoped by the server to their own rows.
 */
const QUERY_KEYS: readonly string[] = [
  "search",
  "sort",
  "direction",
  "course_id",
  "academic_term_id",
  "instructor_id",
  "status",
  "page",
  "per_page"
];

export const COURSE_OFFERING_SORT_FIELDS: readonly string[] = [
  "section",
  "capacity",
  "created_at",
  "id"
];

export function listCourseOfferings(
  params: CourseOfferingListParams = {}
): Promise<Paginated<CourseOffering>> {
  return http
    .get<Paginated<CourseOffering>>("/course-offerings", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getCourseOffering(id: number): Promise<ApiSuccess<CourseOffering>> {
  return http
    .get<ApiSuccess<CourseOffering>>(`/course-offerings/${id}`)
    .then((response) => response.data);
}

export function createCourseOffering(
  payload: CourseOfferingPayload
): Promise<ApiSuccess<CourseOffering>> {
  return http
    .post<ApiSuccess<CourseOffering>>("/course-offerings", payload)
    .then((response) => response.data);
}

export function updateCourseOffering(
  id: number,
  payload: UpdatePayload<CourseOfferingPayload>
): Promise<ApiSuccess<CourseOffering>> {
  return http
    .put<ApiSuccess<CourseOffering>>(`/course-offerings/${id}`, payload)
    .then((response) => response.data);
}

export function deleteCourseOffering(id: number): Promise<ApiSuccess<null>> {
  return http.delete<ApiSuccess<null>>(`/course-offerings/${id}`).then((response) => response.data);
}

/** GET /course-offerings/{id}/students - the class list (page/per_page only). */
export function listCourseOfferingStudents(
  courseOfferingId: number,
  page = 1,
  perPage = PER_PAGE_DEFAULT
): Promise<Paginated<Enrollment>> {
  return http
    .get<Paginated<Enrollment>>(`/course-offerings/${courseOfferingId}/students`, {
      params: buildQuery({ page, per_page: perPage }, ["page", "per_page"])
    })
    .then((response) => response.data);
}
