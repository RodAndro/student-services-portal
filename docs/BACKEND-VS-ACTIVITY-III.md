# BACKEND VS ACTIVITY III REQUIREMENTS

**Status: the Activity III requirements document has NOT been provided.** I searched the workspace
(`student-services-portal/`) and there is no Activity III specification, rubric, or list of
required pages — the only mention of a frontend anywhere is `student-api/README.md` saying *"There
is no graphical frontend — this project is the API only."*

So I **cannot** produce the final requirement-by-requirement table yet, because that would mean
inventing your requirements — which you told me not to do. Instead, this document classifies
**facts about your actual backend** using the four labels you asked for, so that the moment you
send the Activity III spec the mapping is mechanical.

**Legend:** ✅ READY · 🔶 DIFFERENT · ❌ MISSING · ❓ NEEDS VERIFICATION

---

## A. ✅ READY — fully supported by the API today

These need no backend change. Every row was verified against the code (see `docs/API-CONTRACT.md`).

| Frontend capability | Supported by | Notes |
| --- | --- | --- |
| Log in with email + password | `POST /auth/login` | returns token + user |
| Log out | `POST /auth/logout` | revokes current token |
| Know who is logged in | `GET /auth/me` | role available → drive the UI/menu |
| Restrict UI by role | `users.role` in `/auth/me` | 4 roles: admin, registrar, instructor, student |
| Programs: list / search / filter / sort / paginate / create / read / update / delete | `/programs` | delete returns 409 when in use |
| Students: list / search / filter / sort / paginate / create / read / update / delete | `/students` | `full_name` provided ready-made |
| Courses: full CRUD + collection features | `/courses` | |
| Academic Terms: full CRUD + collection features | `/academic-terms` | status includes `UPCOMING` |
| Course Offerings: full CRUD + collection features | `/course-offerings` | includes `enrollments_count` |
| Enrollments: list / create / read / update / delete | `/enrollments` | duplicate + capacity guarded |
| Grades: list / create / read / update | `/grades` | update only (no delete) |
| Student's enrollments | `GET /students/{id}/enrollments` | paginated |
| Student's grades | `GET /students/{id}/grades` | paginated |
| Academic record grouped per term | `GET /students/{id}/academic-record` | ready-made grouped structure |
| Exact-match filtering (ids, status, year, semester) | all collection endpoints | |
| Free-text search | `search` param | partial match, per-resource fields only |
| Sorting + direction | `sort` + `direction` | single column, allow-listed |
| Pagination with metadata | `page` + `per_page`, `meta` object | cap 100 |
| Consistent success/error handling | every endpoint | one envelope everywhere |
| Attractive validation errors | `422` with `errors[field][]` | ready to display under inputs |
| Handling 401 / 403 / 404 / 409 / 422 / 500 | every endpoint | documented shapes |
| Showing a "no data" empty state | `data: []` + `meta.total = 0` | |
| Health indicator | `GET /ping` | public |

---

## B. 🔶 DIFFERENT — supported, but not the shape you might expect

The classic "frontend assumption vs reality" traps. Plan for these.

| # | Area | What a frontend usually assumes | What your API actually does | Impact |
| --- | --- | --- | --- | --- |
| B1 | Login response | `user` has `id, name, email, role` | `login` and `/auth/me` return the **raw user model** including `email_verified_at, created_at, updated_at`; nested `instructor` returns the smaller **UserResource** | Don't write one TypeScript interface for "user" and reuse it everywhere |
| B2 | Enrollment creation | `POST /students/{id}/enrollments` | Only `POST /enrollments` with `student_id` + `course_offering_id` in the body | The enrollment form must fetch both lists first |
| B3 | Grade deletion | `DELETE /grades/{id}` | **Not available** — update only | A "delete grade" button is impossible |
| B4 | Delete responses | `204 No Content` | `200` with `{success, message, data: null}` | Don't parse the body as a resource |
| B5 | Unknown query params | error | silently ignored / fallback | A typo'd filter won't warn you |
| B6 | Sorting | multi-column | single column only | |
| B7 | Filtering | ranges (`grade_from`, date ranges) | exact match only | No "grades between X and Y" |
| B8 | Number of API calls for a dashboard | few aggregate calls | **no aggregate endpoints** | Dashboard stats must be derived from list `meta.total` (and per_page ≤ 100) |
| B9 | Nested objects always exist | always present | `whenLoaded` → **keys are omitted** when the controller didn't eager-load them | Use optional chaining; see API-CONTRACT §9 |
| B10 | Student id after login | `/auth/me` gives the student profile id | It gives the **user** id, not `students.id` | The student UI cannot build `/students/{id}` from `/auth/me` — see C1 |
| B11 | Instructor list scoping | instructor sees all offerings | server silently filters to their own | An instructor UI must not assume it can look up arbitrary offerings |
| B12 | Password rules | enforced on registration | no registration at all | |

---

## C. ❌ MISSING — the API does not provide this

If Activity III asks for any of these, it **cannot** be built against the current API without
adding backend endpoints. I will not fake them.

| # | Not provided | Why it matters to a frontend | Possible resolution |
| --- | --- | --- | --- |
| C1 | **No "my student profile" endpoint** | A logged-in student needs their own `students.id` to call `/students/{id}`, `/students/{id}/enrollments`, `/students/{id}/grades`, `/students/{id}/academic-record`. `/auth/me` returns the *user* id only, and a student cannot list students. | **Backend change needed** (add `GET /students/me` or include `student_id` in `/auth/me`) — or a backend-only decision to match user id to student id in your demo data |
| C2 | **No users/instructors endpoint** (`GET /users`) | The course-offering form needs `instructor_id`, but there is no way to list users to build that dropdown. Same for any "manage users/roles" screen. | Backend change (`GET /users?role=instructor`) or hardcode the 3 seeded instructor ids |
| C3 | **No registration / sign-up** | A "create account" or "register" screen is impossible. | Backend change or explicitly out of scope |
| C4 | **No password change / reset** | A profile/settings screen cannot change a password. | Backend change |
| C5 | **No student ↔ user linking** | You cannot create a login for a newly created student through the API (`students.user_id` is not accepted). | Backend change |
| C6 | **No dashboard / statistics / count endpoints** | A dashboard must be assembled from paginated lists; counts come from `meta.total`. | Client-side, or backend change |
| C7 | **No attendance / schedule / fees / announcements / anything not listed in §A** | Any Activity III page outside the 8 entities has no backend at all. | Needs the Activity III spec first, then possibly backend work |
| C8 | **No file/image uploads** | No avatar or document upload. | Backend change |
| C9 | **No soft delete / restore / audit history** | Deletes are permanent; no "recycle bin". | Backend change |
| C10 | **No bulk operations** | No "enroll many students at once", no bulk grade entry. | Backend change |

---

## D. ❓ NEEDS VERIFICATION — blocked on your Activity III document

I cannot label these either way without the spec. Each one changes the architecture:

| # | Question | Why it decides something big |
| --- | --- | --- |
| D1 | What is the **required frontend stack**? (React / Vue / Blade + JS / plain HTML+CSS+JS / other) | Determines the entire project setup, routing, and state handling |
| D2 | Must the frontend be a **separate SPA on its own origin/port**, or can it be served by the same Laravel app (same origin)? | If separate → CORS must be updated (`CORS_ALLOWED_ORIGINS`) and a dev proxy configured |
| D3 | Which **pages/screens** are required, exactly? | Needed for the final READY/DIFFERENT/MISSING table |
| D4 | Are **user management** and **registration** required? | C2/C3 are currently MISSING and would need backend work |
| D5 | Is a **student portal** (login as student) required? | C1 blocks it today |
| D6 | Is a **dashboard with statistics** required? | No aggregate endpoints exist (C6/B8) |
| D7 | Does Activity III require **search / filter / sort / pagination UI**, or just forms? | The API supports all four; effort differs a lot |
| D8 | Does it require a specific **design/branding** (colors, logo, fonts)? | Affects layout work only |
| D9 | Are **frontend tests** or a specific folder structure required as deliverables? | Affects what "done" means |
| D10 | Must the frontend be **committed to Git/GitHub** as a separate repo or a folder? | Affects where I put the project |
| D11 | Does Activity III require updating the **AI lab notebook / documentation** for this activity? | Extra deliverable |
| D12 | Any **required API documentation** or Postman/OpenAPI deliverable for the frontend side? | Extra deliverable |

---

## E. Exact information / files I need from you

To finish the requirement mapping and then build the frontend correctly, please send:

1. **The Activity III laboratory specification** (the PDF/DOC/image/Word file with the frontend
   requirements, objectives, and grading rubric). This is the single most important missing item —
   everything in section D depends on it.
2. **Any starter/frontend files** you were given (a skeleton project, templates, a required
   `package.json`, wireframes, or screenshots of expected screens).
3. **The mandated or preferred frontend stack**, if the spec allows a choice — and if it allows a
   choice, tell me your preference and I will recommend the simplest option that fits.
4. **Confirmation of where the frontend should live**: a new folder (e.g. `student-web/`) inside
   `student-services-portal`, or a separate repository.
5. **Confirmation on the three backend gaps** — for each, either "add it to the backend" or "out of
   scope":
   - C1: a way for a student to get their own profile id (`/auth/me` returning `student_id`, or a
     `GET /students/me`),
   - C2: an instructors/users lookup for dropdowns,
   - C3: registration (only if Activity III asks for it).
6. **Whether I may change the backend** at all in Activity III, or whether it must stay frozen at
   commit `0f93d8a`. (Several of the missing items can only be solved on the backend.)
7. **Your demo intent** if you already know it: will Activity III be demonstrated by logging in as
   admin only, or as admin + instructor + student?

---

## F. What is NOT blocked

I can start immediately on the parts that are already certain, **as soon as you confirm the stack**:

- a typed API client for all 42 endpoints,
- the login/logout/session layer and role-based menu,
- CRUD screens for the 7 resources that are fully supported (programs, students, courses, academic
  terms, course offerings, enrollments, grades),
- list screens with search / filter / sort / pagination wired to the real query parameters,
- the academic-record view,
- error handling for 401/403/404/409/422/500 with the exact envelopes documented above.

I will **not** write any frontend code until you confirm the Activity III requirements and the
stack — as you instructed.
