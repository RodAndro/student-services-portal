import { useMemo } from "react";
import { academicTermsApi, coursesApi, programsApi } from "../api";
import { SEEDED_INSTRUCTORS } from "../config/backend-limitations";
import { useApiQuery } from "./useApiQuery";
import type { ApiError } from "../lib/errors";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ReferenceOptions {
  options: SelectOption[];
  loading: boolean;
  error: ApiError | null;
}

/** The backend caps `per_page` at 100 (see docs/LIMITATIONS.md, L4). */
const PAGE_SIZE = 100;

/** Programs, for a program select. */
export function useProgramOptions(): ReferenceOptions {
  const query = useApiQuery(
    () => programsApi.listPrograms({ per_page: PAGE_SIZE, sort: "name", direction: "asc" }),
    []
  );

  const options = useMemo(
    () =>
      (query.data?.data ?? []).map((program) => ({
        value: String(program.id),
        label: `${program.code} — ${program.name}`
      })),
    [query.data]
  );

  return { options, loading: query.loading, error: query.error };
}

/** Courses, for a course select. */
export function useCourseOptions(): ReferenceOptions {
  const query = useApiQuery(
    () => coursesApi.listCourses({ per_page: PAGE_SIZE, sort: "course_title", direction: "asc" }),
    []
  );

  const options = useMemo(
    () =>
      (query.data?.data ?? []).map((course) => ({
        value: String(course.id),
        label: `${course.course_code} — ${course.course_title}`
      })),
    [query.data]
  );

  return { options, loading: query.loading, error: query.error };
}

/** Academic terms, for a term select. */
export function useAcademicTermOptions(): ReferenceOptions {
  const query = useApiQuery(
    () =>
      academicTermsApi.listAcademicTerms({
        per_page: PAGE_SIZE,
        sort: "academic_year",
        direction: "desc"
      }),
    []
  );

  const options = useMemo(
    () =>
      (query.data?.data ?? []).map((term) => ({
        value: String(term.id),
        label: `${term.academic_year} · Semester ${term.semester}`
      })),
    [query.data]
  );

  return { options, loading: query.loading, error: query.error };
}

/**
 * Instructors — workaround W1: the API has no users endpoint, so the seeded
 * instructor accounts are used. See docs/LIMITATIONS.md.
 */
export function useInstructorOptions(): ReferenceOptions {
  const options = useMemo(
    () =>
      SEEDED_INSTRUCTORS.map((instructor) => ({
        value: String(instructor.id),
        label: `${instructor.name} (${instructor.email})`
      })),
    []
  );

  return { options, loading: false, error: null };
}
