import { GRADE_MAX, GRADE_MIN } from "../../api/grades.api";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateGradeRequest.
 *
 * The field names are exactly the backend's: `midterm_grade` and `final_grade`
 * (see GradeResource and StoreGradeRequest). Both are `nullable|numeric|min:0|max:100`.
 *
 * `remarks` is NOT part of the payload: the Grade model computes it on save
 * (IN PROGRESS without a final grade, PASSED at 75 or above, FAILED below).
 */

export const GRADE_PASSING_MARK = 75;

export interface GradeFormValues {
  midterm_grade: string;
  final_grade: string;
}

export const emptyGradeForm: GradeFormValues = {
  midterm_grade: "",
  final_grade: ""
};

/** Parses an optional numeric input: "" -> null, otherwise the number (NaN-safe). */
function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function validateGrade(values: GradeFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const midterm = optionalNumber(values.midterm_grade);
  if (midterm !== null) {
    if (Number.isNaN(midterm)) {
      errors.midterm_grade = "Midterm grade must be a number.";
    } else if (midterm < GRADE_MIN || midterm > GRADE_MAX) {
      errors.midterm_grade = `Midterm grade must be between ${GRADE_MIN} and ${GRADE_MAX}.`;
    }
  }

  const final = optionalNumber(values.final_grade);
  if (final !== null) {
    if (Number.isNaN(final)) {
      errors.final_grade = "Final grade must be a number.";
    } else if (final < GRADE_MIN || final > GRADE_MAX) {
      errors.final_grade = `Final grade must be between ${GRADE_MIN} and ${GRADE_MAX}.`;
    }
  }

  if (midterm === null && final === null) {
    errors.midterm_grade = "Enter at least one grade.";
  }

  return errors;
}

export function gradeToPayload(values: GradeFormValues): {
  midterm_grade: number | null;
  final_grade: number | null;
} {
  return {
    midterm_grade: optionalNumber(values.midterm_grade),
    final_grade: optionalNumber(values.final_grade)
  };
}

/** What the API will compute for `remarks`, shown as a preview only. */
export function remarksPreview(values: GradeFormValues): string {
  const final = optionalNumber(values.final_grade);

  if (final === null || Number.isNaN(final)) {
    return "IN PROGRESS";
  }

  return final >= GRADE_PASSING_MARK ? "PASSED" : "FAILED";
}
