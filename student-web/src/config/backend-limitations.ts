/**
 * Documented workarounds for two things the frozen backend does not expose.
 * See docs/LIMITATIONS.md for the full explanation and the backend change that
 * would remove each one.
 *
 * Nothing here replaces API data: every value a screen displays still comes from
 * a real HTTP response. These are only lookup lists for choices the API cannot
 * provide, and they are labelled as such wherever they are used.
 */

export interface SeedInstructor {
  id: number;
  name: string;
  email: string;
}

/**
 * W1 - the course-offering form needs `instructor_id`, and the backend validates
 * that the id belongs to a user with role `instructor`, but there is no users
 * endpoint to build a dropdown from. These are the three instructors created by
 * DatabaseSeeder (ids 3, 4 and 5). Editing an existing offering always shows the
 * instructor the API returned instead of relying on this list.
 */
export const SEEDED_INSTRUCTORS: readonly SeedInstructor[] = [
  { id: 3, name: "Instructor One", email: "instructor@example.com" },
  { id: 4, name: "Instructor Two", email: "instructor2@example.com" },
  { id: 5, name: "Instructor Three", email: "instructor3@example.com" }
];

/** True when the id is one of the seeded instructors (used to validate the select). */
export function isSeededInstructorId(id: number): boolean {
  return SEEDED_INSTRUCTORS.some((instructor) => instructor.id === id);
}
