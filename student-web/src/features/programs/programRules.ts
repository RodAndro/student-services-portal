import { PROGRAM_STATUSES } from "../../api/programs.api";
import type { ActiveStatus, Program, ProgramPayload } from "../../types/api";
import { maxText, oneOf, requiredText } from "../../validation/validators";
import type { FieldErrors } from "../../validation/validators";

/**
 * Client-side mirror of Store/UpdateProgramRequest.
 *
 * `code` must also be unique, but the frontend cannot know the other rows, so that
 * rule is left to the API: a duplicate comes back as 422 with `errors.code` and is
 * displayed under the field.
 */

export interface ProgramFormValues {
  code: string;
  name: string;
  description: string;
  status: ActiveStatus;
}

export const emptyProgramForm: ProgramFormValues = {
  code: "",
  name: "",
  description: "",
  status: "ACTIVE"
};

export function programToForm(program: Program): ProgramFormValues {
  return {
    code: program.code,
    name: program.name,
    description: program.description ?? "",
    status: program.status
  };
}

export function programToPayload(values: ProgramFormValues): ProgramPayload {
  const description = values.description.trim();

  return {
    code: values.code.trim(),
    name: values.name.trim(),
    description: description.length > 0 ? description : null,
    status: values.status
  };
}

export function validateProgram(values: ProgramFormValues): FieldErrors {
  const errors: FieldErrors = {};

  const code = requiredText(values.code, "Code") ?? maxText(values.code.trim(), 20, "Code");
  if (code) {
    errors.code = code;
  }

  const name = requiredText(values.name, "Name") ?? maxText(values.name.trim(), 255, "Name");
  if (name) {
    errors.name = name;
  }

  const status = oneOf(values.status, PROGRAM_STATUSES, "Status");
  if (status) {
    errors.status = status;
  }

  return errors;
}
