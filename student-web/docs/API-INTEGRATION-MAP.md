# API Integration Map — Activity III

Every screen in `student-web` and the **real** backend endpoint it calls. Nothing here is invented:
the paths, methods and roles were taken from the Activity I backend (`student-api/routes/api.php`,
the controllers in `app/Http/Controllers/Api/V1/`, and the policies in `app/Policies/`) and from the
typed API modules in `student-web/src/api/`.

**Base URL:** every path below is relative to `/api/v1`.
In development the browser calls `http://localhost:5173/api/v1/...`, and the Vite dev proxy forwards
it to `http://127.0.0.1:8000/api/v1/...` (see `vite.config.ts`).

**Authentication:** the API uses **Laravel Sanctum opaque bearer tokens** (not JWT). When signed in,
a request interceptor adds `Authorization: Bearer <token>` to every call (`src/lib/http.ts`). The
token is obtained once from `POST /auth/login` and stored in `localStorage`.

**Roles:** the backend implements exactly four roles — `admin`, `registrar`, `instructor`, `student`.
`admin` and `registrar` are "staff" and bypass every policy check (`isStaff()`); the per-role values
below come from the policy classes. Hiding a control in the UI is presentation only — the API is the
authorization boundary.

---

## 1. Authentication and session

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| Sign-in page (`/login`) | `/auth/login` | POST | Exchange `email` + `password` for a bearer token and the user object | **Public** — no token | Any account whose `status` is `ACTIVE`; wrong credentials → `422`, inactive → `403` |
| App bootstrap (`AuthProvider` on load) and Account page (`/account`) | `/auth/me` | GET | Return the signed-in user; restores the session after a browser refresh | Bearer token | Any authenticated role |
| Header **Sign out** | `/auth/logout` | POST | Revoke the token used for that request | Bearer token | Any authenticated role |

No other auth endpoints are used: this API has **no registration, no password reset and no token
refresh**.

---

## 2. Dashboard (`/`) — role-aware

The backend exposes **no statistics endpoint**, so every figure is the `meta.total` of a real
collection requested with `per_page=1`.

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| Staff dashboard — counts | `/students?per_page=1` | GET | Total student count | Bearer token | admin, registrar |
| Staff dashboard — counts | `/programs?per_page=1` | GET | Total program count | Bearer token | admin, registrar, instructor |
| Staff dashboard — counts | `/courses?per_page=1` | GET | Total course count | Bearer token | admin, registrar, instructor |
| Staff dashboard — counts | `/academic-terms?per_page=1` | GET | Total term count | Bearer token | admin, registrar, instructor |
| Staff dashboard — counts | `/course-offerings?per_page=1` | GET | Total offering count | Bearer token | admin, registrar (all) · instructor (own only) |
| Staff dashboard — counts | `/enrollments?per_page=1` | GET | Total enrollment count | Bearer token | admin, registrar (all) · instructor (own offerings) |
| Staff dashboard — counts | `/grades?per_page=1` | GET | Total grade count | Bearer token | admin, registrar (all) · instructor (own offerings) |
| Staff dashboard — "Most recent enrollments" | `/enrollments?per_page=5&sort=id&direction=desc` | GET | Newest five enrollments | Bearer token | admin, registrar |
| Instructor dashboard — own counts | `/course-offerings?per_page=1`, `/enrollments?per_page=1`, `/grades?per_page=1` | GET | Counts scoped by the server to this instructor | Bearer token | instructor (scoped server-side) |
| Instructor dashboard — "Recently recorded grades" | `/grades?per_page=5&sort=id&direction=desc` | GET | Newest five grades in their offerings | Bearer token | instructor (own offerings) |
| Student dashboard — program & year level | `/students/{id}` | GET | The student's own profile (id from `VITE_DEMO_STUDENT_ID`) | Bearer token | owning student |
| Student dashboard — counts | `/students/{id}/enrollments?per_page=1`, `/students/{id}/grades?per_page=1` | GET | The student's own counts | Bearer token | owning student |

---

## 3. Programs (`/programs`, `/programs/new`, `/programs/:id`, `/programs/:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / search / filter / sort / paginate | `/programs` | GET | `search` (code, name), `status`, `sort`, `direction`, `page`, `per_page` | Bearer token | admin, registrar, instructor |
| Detail page | `/programs/{id}` | GET | Show one program | Bearer token | admin, registrar, instructor |
| Create form | `/programs` | POST | Create a program (`code` unique, `name`, `description?`, `status`) | Bearer token | admin, registrar |
| Edit form | `/programs/{id}` | PUT | Update a program | Bearer token | admin, registrar |
| Delete (confirm dialog) | `/programs/{id}` | DELETE | Delete a program — **`409`** while students are assigned | Bearer token | admin, registrar |

---

## 4. Courses (`/courses`, `/courses/new`, `/courses/:id`, `/courses/:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / search / filter / sort / paginate | `/courses` | GET | `search` (course_code, course_title), `status`, sort, pagination | Bearer token | admin, registrar, instructor |
| Detail page | `/courses/{id}` | GET | Show one course | Bearer token | admin, registrar, instructor |
| Create form | `/courses` | POST | Create a course (`course_code` unique, `course_title`, `units` 1–12, `status`) | Bearer token | admin, registrar |
| Edit form | `/courses/{id}` | PUT | Update a course | Bearer token | admin, registrar |
| Delete (confirm dialog) | `/courses/{id}` | DELETE | Delete a course — **`409`** while course offerings exist | Bearer token | admin, registrar |

---

## 5. Academic Terms (`/academic-terms`, `.../new`, `.../:id`, `.../:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / search / filter / sort / paginate | `/academic-terms` | GET | `search` (academic_year), `semester`, `status`, sort, pagination | Bearer token | admin, registrar, instructor |
| Detail page | `/academic-terms/{id}` | GET | Show one term | Bearer token | admin, registrar, instructor |
| Create form | `/academic-terms` | POST | Create a term (`academic_year` + `semester` unique, dates, `status`) | Bearer token | admin, registrar |
| Edit form | `/academic-terms/{id}` | PUT | Update a term | Bearer token | admin, registrar |
| Delete (confirm dialog) | `/academic-terms/{id}` | DELETE | Delete a term — **`409`** while course offerings exist | Bearer token | admin, registrar |

---

## 6. Students (`/students`, `.../new`, `.../:id`, `.../:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / search / filter / sort / paginate | `/students` | GET | `search` (names, student_number, email), `program_id`, `year_level`, `status`, sort, pagination | Bearer token | admin, registrar |
| Detail — Profile tab | `/students/{id}` | GET | Show one student (with `program`) | Bearer token | admin, registrar, **owning student** |
| Detail — Enrollments tab | `/students/{id}/enrollments` | GET | That student's enrollments (`page`, `per_page` only) | Bearer token | admin, registrar, owning student |
| Detail — Grades tab | `/students/{id}/grades` | GET | That student's grades (`page`, `per_page` only) | Bearer token | admin, registrar, owning student |
| Detail — Academic Record tab | `/students/{id}/academic-record` | GET | Grades grouped per academic term (**not paginated**) | Bearer token | admin, registrar, owning student |
| Create form | `/students` | POST | Create a student (`student_number` unique, names, `program_id`, `year_level`, `status`) | Bearer token | admin, registrar |
| Edit form | `/students/{id}` | PUT | Update a student | Bearer token | admin, registrar |
| **Deactivate / Reactivate** | `/students/{id}` | PUT | Update with `{ "status": "INACTIVE" }` / `"ACTIVE"` — there is no deactivate endpoint | Bearer token | admin, registrar |
| Delete (confirm dialog) | `/students/{id}` | DELETE | Delete a student — **`409`** while enrollments exist | Bearer token | admin, registrar |

> Instructors are refused (`403`) by **every** student ability, so the whole `/students` branch is
> staff-only in the router.

---

## 7. Course Offerings (`/course-offerings`, `.../new`, `.../:id`, `.../:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / search / filter / sort / paginate | `/course-offerings` | GET | `search` (section, schedule, room), `course_id`, `academic_term_id`, `instructor_id`, `status`, sort, pagination | Bearer token | admin, registrar (all) · **instructor (own only, server-scoped)** |
| Detail page | `/course-offerings/{id}` | GET | Show one offering (course, term, instructor, `enrollments_count`) | Bearer token | admin, registrar, owning instructor |
| Detail — class list | `/course-offerings/{id}/students` | GET | Enrolled students (`page`, `per_page` only) | Bearer token | admin, registrar, owning instructor |
| Create form | `/course-offerings` | POST | Create an offering (`course_id`, `academic_term_id`, `instructor_id`, `section`, `schedule`, `room?`, `capacity` 1–500, `status`) | Bearer token | admin, registrar |
| Edit form | `/course-offerings/{id}` | PUT | Update an offering | Bearer token | admin, registrar |
| Delete (confirm dialog) | `/course-offerings/{id}` | DELETE | Delete an offering — **`409`** while enrollments exist | Bearer token | admin, registrar |

---

## 8. Enrollments (`/enrollments`, `.../new`, `.../:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / filter / sort / paginate (**no search**) | `/enrollments` | GET | `student_id`, `course_offering_id`, `status`, sort, pagination | Bearer token | admin, registrar (all) · instructor (own offerings) |
| Detail (edit form loads it) | `/enrollments/{id}` | GET | Show one enrollment | Bearer token | admin, registrar, owning instructor, owning student |
| Create form | `/enrollments` | POST | Enroll (`student_id` + `course_offering_id` in the body; optional `enrollment_date`, `status`) — **`409`** if already enrolled or at capacity | Bearer token | admin, registrar |
| Edit form | `/enrollments/{id}` | **PATCH** | Update status / date | Bearer token | admin, registrar |
| Delete (confirm dialog) | `/enrollments/{id}` | DELETE | Delete an enrollment | Bearer token | admin, registrar |

> There is no nested create route (`POST /students/{id}/enrollments` does not exist). Enrolling always
> posts both ids to `/enrollments`.

---

## 9. Grades (`/grades`, `/grades/new`, `/grades/:id/edit`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| List / filter / sort / paginate (**no search**) | `/grades` | GET | `enrollment_id`, sort, pagination | Bearer token | admin, registrar (all) · instructor (own offerings) |
| Detail (edit form loads it) | `/grades/{id}` | GET | Show one grade | Bearer token | admin, registrar, owning instructor, owning student |
| Record form (two-step picker or prefilled) | `/grades` | POST | Create a grade (`enrollment_id`, `midterm_grade?`, `final_grade?`, 0–100) — **`409`** if the enrollment already has a grade | Bearer token | admin, registrar, **owning instructor** (authorized through `EnrollmentPolicy::grade`) |
| Edit form | `/grades/{id}` | PUT | Correct a grade (`remarks` is recomputed by the server) | Bearer token | admin, registrar, owning instructor |
| Delete | — | — | **Does not exist.** `GradeController` has no `destroy` and the route is registered `->except(['destroy'])` | — | — |

---

## 10. Student portal (`/portal`, `/portal/enrollments`, `/portal/grades`, `/portal/academic-record`)

A student is refused by every list endpoint, so these routes are the only data screens a student can
reach. The student profile id comes from `VITE_DEMO_STUDENT_ID` (default `1`) because the API has no
"my profile" endpoint — see [`LIMITATIONS.md`](LIMITATIONS.md) (W2).

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| My Profile (`/portal`) | `/students/{id}` | GET | The student's own record | Bearer token | owning student |
| My Enrollments | `/students/{id}/enrollments` | GET | Their own enrollments | Bearer token | owning student |
| My Grades | `/students/{id}/grades` | GET | Their own grades | Bearer token | owning student |
| My Academic Record | `/students/{id}/academic-record` | GET | Their own record, grouped by term | Bearer token | owning student |

---

## 11. Account (`/account`)

| Frontend feature | API endpoint | Method | Purpose | Authentication | Role / permission |
| --- | --- | --- | --- | --- | --- |
| Account page — details | `/auth/me` | GET | The signed-in user's account information | Bearer token | any authenticated role |

The page is **read-only**: the API has no endpoint to edit a user, change a role, or reset a
password.

---

## 12. Defined but not called by any screen

| API module function | API endpoint | Method | Notes |
| --- | --- | --- | --- |
| `healthApi.ping()` | `/ping` | GET | Public liveness smoke test. Typed and exported in `src/api/`, but **no screen calls it** (no connection indicator is rendered in the UI). |

---

## Notes that keep this honest

- The endpoint set above is exactly what `src/api/*.api.ts` sends — verified by reading each module.
  It is a subset of the backend's 42 routes; endpoints the frontend does not need are not called.
- Every request path is prefixed by the single axios `baseURL` (`/api/v1` by default). No raw `fetch`
  and no second axios instance exists anywhere in `src/`.
- Query parameters are filtered against a per-endpoint allow-list (`src/lib/query.ts`) that mirrors
  the backend's `FiltersAndSorts` trait, so the UI never sends a parameter the API ignores.
- Deletes return `200` with the standard envelope (never `204`); `409` conflicts and `422` validation
  errors are shown with the API's own message.
