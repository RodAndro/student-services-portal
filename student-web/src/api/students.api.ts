import { buildQuery, PER_PAGE_DEFAULT } from "../lib/query";
import { http } from "../lib/http";
import type {
  AcademicRecord,
  ApiSuccess,
  Enrollment,
  Grade,
  Paginated,
  Student,
  StudentListParams,
  StudentPayload,
  UpdatePayload
} from "../types/api";

/**
 * /students - verified against StudentController + Store/UpdateStudentRequest.
 * The four nested routes accept `page` and `per_page` only.
 */
const QUERY_KEYS: readonly string[] = [
  "search",
  "sort",
  "direction",
  "program_id",
  "year_level",
  "status",
  "page",
  "per_page"
];

const PAGE_KEYS: readonly string[] = ["page", "per_page"];

export const STUDENT_SORT_FIELDS: readonly string[] = [
  "last_name",
  "first_name",
  "student_number",
  "year_level",
  "created_at",
  "id"
];

export function listStudents(params: StudentListParams = {}): Promise<Paginated<Student>> {
  return http
    .get<Paginated<Student>>("/students", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getStudent(id: number): Promise<ApiSuccess<Student>> {
  return http.get<ApiSuccess<Student>>(`/students/${id}`).then((response) => response.data);
}

export function createStudent(payload: StudentPayload): Promise<ApiSuccess<Student>> {
  return http.post<ApiSuccess<Student>>("/students", payload).then((response) => response.data);
}

export function updateStudent(
  id: number,
  payload: UpdatePayload<StudentPayload>
): Promise<ApiSuccess<Student>> {
  return http
    .put<ApiSuccess<Student>>(`/students/${id}`, payload)
    .then((response) => response.data);
}

export function deleteStudent(id: number): Promise<ApiSuccess<null>> {
  return http.delete<ApiSuccess<null>>(`/students/${id}`).then((response) => response.data);
}

/** GET /students/{id}/enrollments */
export function listStudentEnrollments(
  studentId: number,
  page = 1,
  perPage = PER_PAGE_DEFAULT
): Promise<Paginated<Enrollment>> {
  return http
    .get<Paginated<Enrollment>>(`/students/${studentId}/enrollments`, {
      params: buildQuery({ page, per_page: perPage }, PAGE_KEYS)
    })
    .then((response) => response.data);
}

/** GET /students/{id}/grades */
export function listStudentGrades(
  studentId: number,
  page = 1,
  perPage = PER_PAGE_DEFAULT
): Promise<Paginated<Grade>> {
  return http
    .get<Paginated<Grade>>(`/students/${studentId}/grades`, {
      params: buildQuery({ page, per_page: perPage }, PAGE_KEYS)
    })
    .then((response) => response.data);
}

/** GET /students/{id}/academic-record - grouped by academic term, not paginated. */
export function getAcademicRecord(studentId: number): Promise<ApiSuccess<AcademicRecord>> {
  return http
    .get<ApiSuccess<AcademicRecord>>(`/students/${studentId}/academic-record`)
    .then((response) => response.data);
}
