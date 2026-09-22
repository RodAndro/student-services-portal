import type { ActiveStatus, CourseOffering, CourseOfferingPayload } from "../../types/api";
import { integerRange, maxText, oneOf, requiredText } from "../../validation/validators";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateCourseOfferingRequest.
 *
 * `instructor_id` must belong to a user with the `instructor` role - the API checks
 * that (`Rule::exists('users','id')->where(role, instructor)`), and so does the
 * select, which only offers the seeded instructors (see docs/LIMITATIONS.md, W1).
 */

export const COURSE_OFFERING_STATUSES: readonly ActiveStatus[] = ["ACTIVE", "INACTIVE"];
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 500;

export interface CourseOfferingFormValues {
  course_id: string;
  academic_term_id: string;
  instructor_id: string;
  section: string;
  schedule: string;
  room: string;
  capacity: string;
  status: ActiveStatus;
}

export const emptyCourseOfferingForm: CourseOfferingFormValues = {
  course_id: "",
  academic_term_id: "",
  instructor_id: "",
  section: "",
  schedule: "",
  room: "",
  capacity: "40",
  status: "ACTIVE"
};

export function courseOfferingToForm(offering: CourseOffering): CourseOfferingFormValues {
  return {
    course_id: String(offering.course_id),
    academic_term_id: String(offering.academic_term_id),
    instructor_id: String(offering.instructor_id),
    section: offering.section,
    schedule: offering.schedule,
    room: offering.room ?? "",
    capacity: String(offering.capacity),
    status: offering.status
  };
}

export function courseOfferingToPayload(values: CourseOfferingFormValues): CourseOfferingPayload {
  const room = values.room.trim();
  const capacity = Number(values.capacity);

  return {
    course_id: Number(values.course_id),
    academic_term_id: Number(values.academic_term_id),
    instructor_id: Number(values.instructor_id),
    section: values.section.trim(),
    schedule: values.schedule.trim(),
    room: room.length > 0 ? room : null,
    capacity: Number.isFinite(capacity) ? capacity : 0,
    status: values.status
  };
}

export function validateCourseOffering(values: CourseOfferingFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.course_id.trim().length === 0) {
    errors.course_id = "Course is required.";
  }

  if (values.academic_term_id.trim().length === 0) {
    errors.academic_term_id = "Academic term is required.";
  }

  if (values.instructor_id.trim().length === 0) {
    errors.instructor_id = "Instructor is required.";
  }

  const section =
    requiredText(values.section, "Section") ?? maxText(values.section.trim(), 20, "Section");
  if (section) {
    errors.section = section;
  }

  const schedule =
    requiredText(values.schedule, "Schedule") ?? maxText(values.schedule.trim(), 100, "Schedule");
  if (schedule) {
    errors.schedule = schedule;
  }

  const room = maxText(values.room.trim(), 50, "Room");
  if (room) {
    errors.room = room;
  }

  const rawCapacity = values.capacity.trim();
  const capacity =
    rawCapacity.length === 0
      ? "Capacity is required."
      : integerRange(Number(rawCapacity), CAPACITY_MIN, CAPACITY_MAX, "Capacity");
  if (capacity) {
    errors.capacity = capacity;
  }

  const status = oneOf(values.status, COURSE_OFFERING_STATUSES, "Status");
  if (status) {
    errors.status = status;
  }

  return errors;
}
