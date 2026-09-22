import { http } from "../lib/http";
import { buildQuery } from "../lib/query";
import type {
  AcademicTerm,
  AcademicTermListParams,
  AcademicTermPayload,
  ApiSuccess,
  Paginated,
  TermStatus,
  UpdatePayload
} from "../types/api";

/**
 * /academic-terms - verified against AcademicTermController + Store/UpdateAcademicTermRequest:
 *
 *   GET    /academic-terms          list (search, semester, status, sort, direction, page, per_page)
 *   POST   /academic-terms          create
 *   GET    /academic-terms/{id}     show
 *   PUT    /academic-terms/{id}     update (partial allowed)
 *   DELETE /academic-terms/{id}     delete - 409 when course offerings exist
 *
 * The resource route uses `{academic_term}` as the parameter name, but the URL is
 * the same shape as the others: /academic-terms/{id}.
 */
const QUERY_KEYS: readonly string[] = [
  "search",
  "sort",
  "direction",
  "semester",
  "status",
  "page",
  "per_page"
];

/** Sortable columns, exactly as declared by the controller. */
export const ACADEMIC_TERM_SORT_FIELDS: readonly string[] = [
  "academic_year",
  "semester",
  "start_date",
  "id"
];

/** `UPCOMING` exists because a term is time-based: UPCOMING -> ACTIVE -> INACTIVE. */
export const ACADEMIC_TERM_STATUSES: readonly TermStatus[] = ["ACTIVE", "UPCOMING", "INACTIVE"];

/** The backend validates semester with `in:1,2,3`. */
export const SEMESTERS: readonly number[] = [1, 2, 3];

export function listAcademicTerms(
  params: AcademicTermListParams = {}
): Promise<Paginated<AcademicTerm>> {
  return http
    .get<Paginated<AcademicTerm>>("/academic-terms", { params: buildQuery(params, QUERY_KEYS) })
    .then((response) => response.data);
}

export function getAcademicTerm(id: number): Promise<ApiSuccess<AcademicTerm>> {
  return http
    .get<ApiSuccess<AcademicTerm>>(`/academic-terms/${id}`)
    .then((response) => response.data);
}

export function createAcademicTerm(
  payload: AcademicTermPayload
): Promise<ApiSuccess<AcademicTerm>> {
  return http
    .post<ApiSuccess<AcademicTerm>>("/academic-terms", payload)
    .then((response) => response.data);
}

export function updateAcademicTerm(
  id: number,
  payload: UpdatePayload<AcademicTermPayload>
): Promise<ApiSuccess<AcademicTerm>> {
  return http
    .put<ApiSuccess<AcademicTerm>>(`/academic-terms/${id}`, payload)
    .then((response) => response.data);
}

export function deleteAcademicTerm(id: number): Promise<ApiSuccess<null>> {
  return http.delete<ApiSuccess<null>>(`/academic-terms/${id}`).then((response) => response.data);
}
