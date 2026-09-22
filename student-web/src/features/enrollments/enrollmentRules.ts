import type { Enrollment, EnrollmentPayload, EnrollmentStatus } from "../../types/api";
import { integerRange, oneOf, requiredDate } from "../../validation/validators";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateEnrollmentRequest.
 *
 * Two behaviours belong to the API and are surfaced from its 409 response rather
 * than guessed here:
 *  - the student is already enrolled in that offering
 *    ("The student is already enrolled in this course offering.")
 *  - the offering is full ("This course offering has reached its capacity.")
 */

export const ENROLLMENT_STATUS_OPTIONS: readonly EnrollmentStatus[] = [
  "ENROLLED",
  "DROPPED",
  "COMPLETED"
];

export interface EnrollmentFormValues {
  student_id: string;
  course_offering_id: string;
  enrollment_date: string;
  status: EnrollmentStatus;
}

export const emptyEnrollmentForm: EnrollmentFormValues = {
  student_id: "",
  course_offering_id: "",
  enrollment_date: "",
  status: "ENROLLED"
};

export function enrollmentToForm(enrollment: Enrollment): EnrollmentFormValues {
  return {
    student_id: String(enrollment.student_id),
    course_offering_id: String(enrollment.course_offering_id),
    enrollment_date: enrollment.enrollment_date,
    status: enrollment.status
  };
}

export function enrollmentToPayload(values: EnrollmentFormValues): EnrollmentPayload {
  const date = values.enrollment_date.trim();

  return {
    student_id: Number(values.student_id),
    course_offering_id: Number(values.course_offering_id),
    // Omitting the date lets the API default it to today.
    enrollment_date: date.length > 0 ? date : undefined,
    status: values.status
  };
}

export function validateEnrollment(values: EnrollmentFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const student = integerRange(
    values.student_id.trim().length > 0 ? Number(values.student_id) : null,
    1,
    Number.MAX_SAFE_INTEGER,
    "Student"
  );
  if (student) {
    errors.student_id = "Student is required.";
  }

  const offering = integerRange(
    values.course_offering_id.trim().length > 0 ? Number(values.course_offering_id) : null,
    1,
    Number.MAX_SAFE_INTEGER,
    "Course offering"
  );
  if (offering) {
    errors.course_offering_id = "Course offering is required.";
  }

  // `nullable|date`: optional, but if given it must be a real date.
  if (values.enrollment_date.trim().length > 0) {
    const date = requiredDate(values.enrollment_date, "Enrollment date");
    if (date) {
      errors.enrollment_date = date;
    }
  }

  const status = oneOf(values.status, ENROLLMENT_STATUS_OPTIONS, "Status");
  if (status) {
    errors.status = status;
  }

  return errors;
}
