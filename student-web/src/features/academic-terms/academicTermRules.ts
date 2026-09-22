import { ACADEMIC_TERM_STATUSES, SEMESTERS } from "../../api/academicTerms.api";
import type { AcademicTerm, AcademicTermPayload, TermStatus } from "../../types/api";
import { dateAfter, maxText, oneOf, requiredDate, requiredText } from "../../validation/validators";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateAcademicTermRequest.
 *
 * Two things worth knowing:
 *  - `academic_year` must be unique **together with `semester`**, so it is only
 *    checked by the API (422 -> errors.academic_year).
 *  - `end_date` must be after `start_date` on both create and update (the update
 *    request falls back to the existing start_date when one is not sent). This
 *    mirror always compares the form's own start_date, which the edit form always
 *    submits, so it never blocks a change the API would accept.
 */

export interface AcademicTermFormValues {
  academic_year: string;
  semester: string;
  start_date: string;
  end_date: string;
  status: TermStatus;
}

export const emptyAcademicTermForm: AcademicTermFormValues = {
  academic_year: "",
  semester: "1",
  start_date: "",
  end_date: "",
  status: "ACTIVE"
};

export function academicTermToForm(term: AcademicTerm): AcademicTermFormValues {
  return {
    academic_year: term.academic_year,
    semester: String(term.semester),
    start_date: term.start_date,
    end_date: term.end_date,
    status: term.status
  };
}

export function academicTermToPayload(values: AcademicTermFormValues): AcademicTermPayload {
  return {
    academic_year: values.academic_year.trim(),
    semester: Number(values.semester),
    start_date: values.start_date,
    end_date: values.end_date,
    status: values.status
  };
}

export function validateAcademicTerm(values: AcademicTermFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const year =
    requiredText(values.academic_year, "Academic year") ??
    maxText(values.academic_year.trim(), 20, "Academic year");
  if (year) {
    errors.academic_year = year;
  }

  const semester = SEMESTERS.includes(Number(values.semester))
    ? undefined
    : "Semester must be 1, 2 or 3.";
  if (semester) {
    errors.semester = semester;
  }

  const start = requiredDate(values.start_date, "Start date");
  if (start) {
    errors.start_date = start;
  }

  const end = requiredDate(values.end_date, "End date");
  if (end) {
    errors.end_date = end;
  } else {
    const order = dateAfter(values.end_date, values.start_date, "End date", "the start date");
    if (order) {
      errors.end_date = order;
    }
  }

  const status = oneOf(values.status, ACADEMIC_TERM_STATUSES, "Status");
  if (status) {
    errors.status = status;
  }

  return errors;
}
