/**
 * Types for the Activity I Laravel REST API.
 *
 * These mirror the real responses (documented in the repository root at
 * `docs/API-CONTRACT.md`). Two rules to remember:
 *
 * 1. Every endpoint answers with the envelope `{ success, message, data }`, and
 *    collection endpoints add a `meta` object. Errors use `{ success: false, message }`
 *    plus `errors` on 422.
 * 2. Nested objects are marked optional because Laravel's `whenLoaded` omits the key
 *    entirely when the controller did not eager-load that relation. Always guard them.
 */

/* ------------------------------------------------------------------ basics */

export type UserRole = "admin" | "registrar" | "instructor" | "student";
export type ActiveStatus = "ACTIVE" | "INACTIVE";
export type TermStatus = "ACTIVE" | "UPCOMING" | "INACTIVE";
export type EnrollmentStatus = "ENROLLED" | "DROPPED" | "COMPLETED";
export type GradeRemarks = "PASSED" | "FAILED" | "IN PROGRESS";

/* --------------------------------------------------------------- envelopes */

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/** A paginated collection response. */
export interface Paginated<T> extends ApiSuccess<T[]> {
  meta: PaginationMeta;
}

/** The shape of a failed response body. */
export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/* -------------------------------------------------------------------- auth */

/** Returned by POST /auth/login and GET /auth/me (the raw user model). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  role: UserRole;
  status: ActiveStatus;
  created_at?: string;
  updated_at?: string;
}

/** The smaller shape used for a nested instructor (UserResource). */
export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: ActiveStatus;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  token_type: string;
  user: AuthUser;
}

/** GET /ping */
export interface PingResult {
  service: string;
  version: string;
  time: string;
}

/* --------------------------------------------------------------- resources */

export interface Program {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: ActiveStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  course_code: string;
  course_title: string;
  description: string | null;
  units: number;
  status: ActiveStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicTerm {
  id: number;
  academic_year: string;
  semester: number;
  start_date: string;
  end_date: string;
  status: TermStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: number;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  full_name: string;
  birth_date: string | null;
  email: string | null;
  contact_number: string | null;
  address: string | null;
  program_id: number;
  program?: Program;
  year_level: number;
  status: ActiveStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CourseOffering {
  id: number;
  course_id: number;
  course?: Course;
  academic_term_id: number;
  academic_term?: AcademicTerm;
  instructor_id: number;
  instructor?: UserSummary;
  section: string;
  schedule: string;
  room: string | null;
  capacity: number;
  enrollments_count?: number;
  status: ActiveStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Grade {
  id: number;
  enrollment_id: number;
  midterm_grade: number | null;
  final_grade: number | null;
  remarks: GradeRemarks;
  enrollment?: Enrollment;
  created_at?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  student?: Student;
  course_offering_id: number;
  course_offering?: CourseOffering;
  enrollment_date: string;
  status: EnrollmentStatus;
  grade?: Grade | null;
  created_at?: string;
  updated_at?: string;
}

/* --------------------------------------------------------- academic record */

export interface AcademicRecordGrade {
  midterm_grade: number | null;
  final_grade: number | null;
  remarks: GradeRemarks;
}

export interface AcademicRecordEntry {
  enrollment_id: number;
  course: Course;
  section: string;
  schedule: string;
  status: EnrollmentStatus;
  grade: AcademicRecordGrade | null;
}

export interface AcademicRecordTerm {
  academic_term: AcademicTerm;
  enrollments: AcademicRecordEntry[];
}

/** GET /students/{id}/academic-record */
export interface AcademicRecord {
  student: Student;
  academic_record: AcademicRecordTerm[];
}

/* ------------------------------------------------------------ list params */
/* Only the parameters each endpoint really supports are declared, so the UI
   can never send something the backend ignores.                                */

export type SortDirection = "asc" | "desc";

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: SortDirection;
}

export interface StudentListParams extends ListParams {
  program_id?: number;
  year_level?: number;
  status?: ActiveStatus;
}

export interface ProgramListParams extends ListParams {
  status?: ActiveStatus;
}

export interface CourseListParams extends ListParams {
  status?: ActiveStatus;
}

export interface AcademicTermListParams extends ListParams {
  semester?: number;
  status?: TermStatus;
}

export interface CourseOfferingListParams extends ListParams {
  course_id?: number;
  academic_term_id?: number;
  instructor_id?: number;
  status?: ActiveStatus;
}

/** /enrollments has no `search` parameter on the backend. */
export interface EnrollmentListParams extends Omit<ListParams, "search"> {
  student_id?: number;
  course_offering_id?: number;
  status?: EnrollmentStatus;
}

/** /grades has no `search` parameter on the backend. */
export interface GradeListParams extends Omit<ListParams, "search"> {
  enrollment_id?: number;
}

/* ------------------------------------------------------------- write bodies */

export interface ProgramPayload {
  code: string;
  name: string;
  description?: string | null;
  status: ActiveStatus;
}

export interface CoursePayload {
  course_code: string;
  course_title: string;
  description?: string | null;
  units: number;
  status: ActiveStatus;
}

export interface AcademicTermPayload {
  academic_year: string;
  semester: number;
  start_date: string;
  end_date: string;
  status: TermStatus;
}

export interface StudentPayload {
  student_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  birth_date?: string | null;
  email?: string | null;
  contact_number?: string | null;
  address?: string | null;
  program_id: number;
  year_level: number;
  status: ActiveStatus;
}

export interface CourseOfferingPayload {
  course_id: number;
  academic_term_id: number;
  instructor_id: number;
  section: string;
  schedule: string;
  room?: string | null;
  capacity: number;
  status: ActiveStatus;
}

export interface EnrollmentPayload {
  student_id: number;
  course_offering_id: number;
  enrollment_date?: string;
  status?: EnrollmentStatus;
}

export interface GradePayload {
  enrollment_id: number;
  midterm_grade?: number | null;
  final_grade?: number | null;
}

/** Update bodies accept a subset of the create fields. */
export type UpdatePayload<T> = Partial<T>;
