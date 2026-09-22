import type { ActiveStatus, Student, StudentPayload } from "../../types/api";
import { maxText, oneOf, requiredText } from "../../validation/validators";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateStudentRequest.
 *
 * Everything the user types lives in the form as a string (so empty inputs behave),
 * and `studentToPayload` converts it. Uniqueness of `student_number` and the
 * existence of `program_id` are enforced by the API (422 -> errors.<field>).
 */

export const STUDENT_STATUSES: readonly ActiveStatus[] = ["ACTIVE", "INACTIVE"];
export const YEAR_LEVELS: readonly number[] = [1, 2, 3, 4];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface StudentFormValues {
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  birth_date: string;
  email: string;
  contact_number: string;
  address: string;
  program_id: string;
  year_level: string;
  status: ActiveStatus;
}

export const emptyStudentForm: StudentFormValues = {
  student_number: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  birth_date: "",
  email: "",
  contact_number: "",
  address: "",
  program_id: "",
  year_level: "1",
  status: "ACTIVE"
};

export function studentToForm(student: Student): StudentFormValues {
  return {
    student_number: student.student_number,
    first_name: student.first_name,
    middle_name: student.middle_name ?? "",
    last_name: student.last_name,
    suffix: student.suffix ?? "",
    birth_date: student.birth_date ?? "",
    email: student.email ?? "",
    contact_number: student.contact_number ?? "",
    address: student.address ?? "",
    program_id: String(student.program_id),
    year_level: String(student.year_level),
    status: student.status
  };
}

/** Empty optional strings become null, matching the `nullable` server rules. */
function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function studentToPayload(values: StudentFormValues): StudentPayload {
  return {
    student_number: values.student_number.trim(),
    first_name: values.first_name.trim(),
    middle_name: optional(values.middle_name),
    last_name: values.last_name.trim(),
    suffix: optional(values.suffix),
    birth_date: optional(values.birth_date),
    email: optional(values.email),
    contact_number: optional(values.contact_number),
    address: optional(values.address),
    program_id: Number(values.program_id),
    year_level: Number(values.year_level),
    status: values.status
  };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateStudent(values: StudentFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const number =
    requiredText(values.student_number, "Student number") ??
    maxText(values.student_number.trim(), 50, "Student number");
  if (number) {
    errors.student_number = number;
  }

  const firstName =
    requiredText(values.first_name, "First name") ??
    maxText(values.first_name.trim(), 100, "First name");
  if (firstName) {
    errors.first_name = firstName;
  }

  const lastName =
    requiredText(values.last_name, "Last name") ??
    maxText(values.last_name.trim(), 100, "Last name");
  if (lastName) {
    errors.last_name = lastName;
  }

  const middle = maxText(values.middle_name.trim(), 100, "Middle name");
  if (middle) {
    errors.middle_name = middle;
  }

  const suffix = maxText(values.suffix.trim(), 20, "Suffix");
  if (suffix) {
    errors.suffix = suffix;
  }

  // Mirrors `date|before:today`.
  if (values.birth_date.trim().length > 0) {
    if (Number.isNaN(new Date(values.birth_date).getTime())) {
      errors.birth_date = "Birth date must be a valid date.";
    } else if (values.birth_date >= todayIsoDate()) {
      errors.birth_date = "Birth date must be before today.";
    }
  }

  // Mirrors `email|max:255` (optional).
  const email = values.email.trim();
  if (email.length > 0 && !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  } else if (email.length > 255) {
    errors.email = "Email may not be longer than 255 characters.";
  }

  const contact = maxText(values.contact_number.trim(), 50, "Contact number");
  if (contact) {
    errors.contact_number = contact;
  }

  if (values.program_id.trim().length === 0) {
    errors.program_id = "Program is required.";
  }

  // Mirrors `integer|in:1,2,3,4`.
  const yearLevel = oneOf(values.year_level, ["1", "2", "3", "4"], "Year level");
  if (yearLevel) {
    errors.year_level = yearLevel;
  }

  const status = oneOf(values.status, STUDENT_STATUSES, "Status");
  if (status) {
    errors.status = status;
  }

  return errors;
}
