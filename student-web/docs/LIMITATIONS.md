# Known Limitations & Workarounds

The Activity I backend is **frozen**: this frontend does not add endpoints, change controllers, or
open a database connection. A few screens therefore need an explicit workaround, or simply cannot
offer something a reader might expect. Everything is listed here rather than hidden.

Legend: **W** = workaround in the frontend · **L** = backend limitation the UI works around by
design.

---

## W1 — Selecting an instructor for a course offering

**Problem.** `POST /course-offerings` requires `instructor_id`, and `StoreCourseOfferingRequest`
validates that the id belongs to a user whose `role` is `instructor`. There is **no users
endpoint** anywhere in the API (`GET /users` returns 404), so a dropdown cannot be populated from
the server.

**Workaround.** `src/config/backend-limitations.ts` holds the three instructors created by
`DatabaseSeeder` (ids 3, 4 and 5, matching `instructor@example.com`, `instructor2@example.com` and
`instructor3@example.com`). The offering form labels the field *"seeded instructors - the API
exposes no users endpoint"* so nobody mistakes it for live data. When **editing** an offering the
form shows the instructor object the API returned, not the constant.

**Removed by:** adding `GET /users?role=instructor` (or a `GET /instructors` lookup) to the backend.

---

## W2 — A student discovering their own profile id

**Problem.** The student portal needs `students.id` to call `/students/{id}/...`, but `GET /auth/me`
returns the **user** record (id 6 for the demo student, whose student profile is id 1) and a student
is refused by `GET /students` (403). There is no "my profile" endpoint.

**Workaround.** `VITE_DEMO_STUDENT_ID` (default `1`, the seeded demo student) supplies the id. If it
is wrong the API answers `403` and the portal shows an explanatory message instead of failing
silently.

**Removed by:** returning `student_id` from `/auth/me`, or adding `GET /students/me`.

---

## L1 — Deactivate does not exist; delete is permanent

There is no deactivate endpoint and no soft delete. Two real options are offered instead:

- **status field** — `PUT` with `{"status": "INACTIVE"}` retires a program, course, term, offering,
  enrollment or student while keeping the record.
- **DELETE** — removes the row permanently, and the API refuses it with **409** while dependent
  records exist (students → enrollments, course/term → offerings, offering → enrollments).

---

## L2 — Grades cannot be deleted

The API exposes no `DELETE /grades/{id}` (`GradeController` has no `destroy`, and the route is
registered `->except(['destroy'])`). A wrong grade is corrected by editing it — the UI deliberately
shows no delete action for grades.

---

## L3 — `/enrollments` and `/grades` have no search parameter

`EnrollmentController` and `GradeController` receive no searchable columns, so there is no free-text
search on those lists. Because of that:

- the enrolment list filters by `student_id`, `course_offering_id` and `status` only;
- choosing an enrollment for a new grade is a **two-step** flow (pick a course offering, then pick a
  student from that offering's class list via `GET /course-offerings/{id}/students`), since
  enrollments themselves cannot be searched by name.

---

## L4 — Lookup lists are capped at 100 rows

`per_page` is silently capped at 100 by the backend, so the program / course / academic-term selects
load at most 100 options. An installation with more would need a remote-search picker; the students
picker already works that way because there are 100+ students.

---

## L5 — Nested responses omit relations that were not eager-loaded

Resources use Laravel's `whenLoaded`, so a nested key is **absent** (not `null`) when the controller
did not load it — for example `course_offering.instructor` is missing from the enrolments list. The
UI treats every nested object as optional and shows `—` rather than "undefined".

---

## L6 — Unknown sort fields and oversized per_page do not error

An unrecognised `sort` silently falls back to the resource's default and `per_page=500` becomes
`100`. The UI only offers columns from each controller's allow-list so this is never hit in
practice.

---

## L7 — Single-column sorting, exact-match filters only

`FiltersAndSorts` supports one `sort` column with a direction, and equality filters. There are no
range filters, no date filters, and no multi-column sorting, so the UI offers none.

---

## L8 — `/ping` proves liveness, not readiness

`GET /ping` does not touch the database, so it keeps answering `200` while MySQL is down. The
sign-in screen's connection check can therefore read as reachable and the sign-in itself then fail
with `500 Server error.`. Both messages are accurate: the API process is up, the database is not.
Nothing in the frontend can tell them apart beyond these two responses.

---

## L9 — A stopped backend reaches the browser as `502`, not a connection error

In development every request goes through the Vite proxy, so when `php artisan serve` is stopped the
browser receives **`502` with an empty body** from the proxy instead of a connection failure. There
is no API envelope in that response, which the client detects and reports as "cannot reach the API"
(including the HTTP status) rather than as a data problem. A production build talking to the API
directly gets a connection error instead and reports the same thing with status `0`.

