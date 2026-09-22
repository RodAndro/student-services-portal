/**
 * Factories for API-shaped test data.
 *
 * The shapes mirror the real resources (StudentResource, ProgramResource, the auth
 * payload from POST /auth/login) so the tests feed the application exactly what the
 * backend sends - `full_name`, nested `program`, ISO timestamps and all.
 */

import type { AuthUser, Program, Student } from "../types/api";

export function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: 2,
    code: "BSCS",
    name: "BS Computer Science",
    description: "Computing",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00+00:00",
    updated_at: "2026-01-01T00:00:00+00:00",
    ...overrides
  };
}

export function makeStudent(overrides: Partial<Student> = {}): Student {
  const first = overrides.first_name ?? "Maria";
  const last = overrides.last_name ?? "Santos";

  return {
    id: 12,
    student_number: "2026-00012",
    first_name: first,
    middle_name: null,
    last_name: last,
    suffix: null,
    full_name: `${first} ${last}`,
    birth_date: "2005-04-11",
    email: "maria.santos@example.com",
    contact_number: "09171234567",
    address: "123 Rizal Street",
    program_id: 2,
    year_level: 2,
    status: "ACTIVE",
    program: makeProgram(),
    created_at: "2026-01-01T00:00:00+00:00",
    updated_at: "2026-01-01T00:00:00+00:00",
    ...overrides
  };
}

export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    name: "System Administrator",
    email: "admin@example.com",
    role: "admin",
    status: "ACTIVE",
    ...overrides
  };
}

/** The body of POST /auth/login. */
export function makeLoginPayload(user: AuthUser, token = "1|test-token") {
  return { token, token_type: "Bearer" as const, user };
}
