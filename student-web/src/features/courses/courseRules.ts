import { COURSE_STATUSES, COURSE_UNITS_MAX, COURSE_UNITS_MIN } from "../../api/courses.api";
import type { ActiveStatus, Course, CoursePayload } from "../../types/api";
import { integerRange, maxText, oneOf, requiredText } from "../../validation/validators";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateCourseRequest.
 * Uniqueness of `course_code` is left to the API (422 -> errors.course_code).
 */

export interface CourseFormValues {
  course_code: string;
  course_title: string;
  description: string;
  units: string;
  status: ActiveStatus;
}

export const emptyCourseForm: CourseFormValues = {
  course_code: "",
  course_title: "",
  description: "",
  units: "3",
  status: "ACTIVE"
};

export function courseToForm(course: Course): CourseFormValues {
  return {
    course_code: course.course_code,
    course_title: course.course_title,
    description: course.description ?? "",
    units: String(course.units),
    status: course.status
  };
}

export function courseToPayload(values: CourseFormValues): CoursePayload {
  const description = values.description.trim();
  const units = Number(values.units);

  return {
    course_code: values.course_code.trim(),
    course_title: values.course_title.trim(),
    description: description.length > 0 ? description : null,
    units: Number.isFinite(units) ? units : 0,
    status: values.status
  };
}

export function validateCourse(values: CourseFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const code =
    requiredText(values.course_code, "Course code") ??
    maxText(values.course_code.trim(), 20, "Course code");
  if (code) {
    errors.course_code = code;
  }

  const title =
    requiredText(values.course_title, "Course title") ??
    maxText(values.course_title.trim(), 255, "Course title");
  if (title) {
    errors.course_title = title;
  }

  const rawUnits = values.units.trim();
  const units =
    rawUnits.length === 0
      ? "Units are required."
      : integerRange(Number(rawUnits), COURSE_UNITS_MIN, COURSE_UNITS_MAX, "Units");
  if (units) {
    errors.units = units;
  }

  const status = oneOf(values.status, COURSE_STATUSES, "Status");
  if (status) {
    errors.status = status;
  }

  return errors;
}
