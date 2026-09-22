# AI Development Log — Activity III (Frontend)

One entry per feature/phase, recorded while the work happened. Each entry lists the prompt used,
what the AI produced, what was accepted / modified / rejected and why, how the result was verified,
and which backend endpoints are involved.

This is the "AI accelerates development; the developer owns the result" requirement made auditable,
and it doubles as material for the Activity III write-up.

**AI tool used for every task below:** *Command Code* — the instructor-approved AI coding assistant,
used in small, verifiable phases.

**How to read the "Human review" column:** the AI produced a suggestion; the developer reviewed it,
then **accepted, modified or rejected** it against a check of the real backend and the real
behaviour. A review is only recorded as done when there is an artifact to back it (a code change, a
passing test, a live API assertion, or a build). Nothing is claimed as a human action without that
evidence; where a claim could not be verified, it is marked as such.

---

## Development task summary

| Task | AI tool | Prompt summary | AI result | Human review | Evidence |
| --- | --- | --- | --- | --- | --- |
| **Project setup / foundation** (scaffold, folders, config, error-handling base) | Command Code | "Create the separate React + Vite + TypeScript frontend for Activity III: router, layouts, reusable components, API-service foundation, configurable base URL, `.env.example`, no secrets, no mock API." | A `create-vite` React-TS scaffold, layered folder plan (`types → lib → api → hooks → components → features`), one axios instance with interceptors, `useApiQuery`, `DataState`, Vite dev proxy. | **Modified** — 4 changes: relative base URL `/api/v1` instead of an absolute URL; kept the template's oxlint instead of adding ESLint; a per-endpoint query-parameter allow-list; `loading` derived from a request key instead of set in the effect. | §Phase 1 table; `npm run typecheck`/`lint`/`build` clean; `GET /api/v1/ping` through the proxy returned `200` |
| **Authentication** (login, session restore, logout, 401 handling) | Command Code | "Implement the full auth system against the real Activity I mechanism: login form, loading state, invalid-login handling, auth state, current user, logout, protected routes, 401/403 handling, role-aware navigation. Do not assume JWT." | `AuthContext` + `AuthProvider`, token in `localStorage`, `RequireAuth`/`RequireRole` guards, a 401 interceptor, a `/auth/me` bootstrap call, a validated login form. | **Modified** — 5 changes: Sanctum opaque tokens (no JWT/refresh); distinguish 401/403 from a network error at bootstrap; `sessionExpired` also set by the provider; single `navItemsForRole()` source; added a dev-account quick-fill panel. | §Phase 2 — `npm test` 10/10, live suite 23/23; endpoints `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| **Routing** (route table, guards, 403/404) | Command Code | "Add the router, layouts and protected routes; a hidden link must also be a refused direct visit." | A `routes` array wrapped in `RequireAuth`/`RequireRole`, 403/404/500 pages, an exported route table for tests. | **Modified** — moved role lists into `navigation.ts` so the layout and the guards share one source of truth; exported `routes` separately from the browser router. | §Testing pass — `src/__tests__/routing.test.tsx` mounts the real table (16 path/role combinations); final `npm test` 132/132 |
| **API integration** (service layer + reference data: Programs, Courses, Academic Terms) | Command Code | "Verify the exact endpoints first, then build a centralised, typed API layer and the three reference-data modules with list/view/create/edit/delete, validation, states, toasts, confirmation and pagination." | A `lib/http.ts` + `lib/errors.ts` + `lib/query.ts` layer, `api/*.api.ts` modules returning the real envelope, and three CRUD modules on shared data components. | **Modified** — mutations return the full envelope (so toasts show the API's wording); extracted shared table/toolbar/dialog components; list state moved into the URL; deleted a `useAsyncAction` hook; **did not invent** a deactivate endpoint. | §Centralised API service layer — `npm test` 10/10; live API suite **64/64**; `npm run build` clean |
| **Student module** | Command Code | "Implement the complete Student module against the real API: list with search/filters/sort/pagination, create, edit, delete/deactivate with confirmation, a detail page, and 401/403/404/409/422/500 handling. No hard-coded students." | A list page, a form with client rules mirroring the Form Requests, a layout route with four tab child routes, and delete/deactivate flows. | **Modified** — offered both real options (PUT `status` for deactivate, DELETE for permanent); loaded the student once and shared it with tabs; used `useProgramOptions()` for the filter and the form; uncovered and fixed an error-handling bug (see Debugging). | §Students module — live API suite **56/56**; `npm test` 18/18; error tests 3/8 failing before the fix, all passing after |
| **Academic modules** (Course Offerings, Enrollments, Grades) | Command Code | "Implement the academic transaction modules using only the real contract: offerings, enrollments, grades; follow the backend's actual grade fields; role-aware behaviour follows the real permissions." | Offering/enrollment/grade list, form and detail screens, a reusable `RemoteSelect`, and permission-aware actions. | **Modified** — verified the grade fields really are `midterm_grade`/`final_grade` before using them; a two-step enrollment picker (because `/enrollments` has no `search`); **no grade delete** (no such endpoint); seeded-instructor dropdown because there is no users endpoint. | §Academic transaction modules — live API suite **73/73**, including capacity `409`, duplicate `409`, `DELETE /grades/{id}` → `405` |
| **Dashboard, account, academic record, student portal** | Command Code | "Add the role-aware dashboard from real API data (no fake statistics), a profile/account page from real capabilities, the academic record view, and the student portal." | Three role-specific dashboards built from `meta.total`, a read-only account page, and a shared academic-record component used by staff and portal. | **Modified** — no GPA/averages invented; account page left read-only; three dashboard components instead of one (a student asking for `/students` would get 403); removed an unnecessary context read. | §Dashboard/portal — `npm test` 73/73; live suite **69/69**; `/auth/me` + nested endpoints only |
| **UI improvements** (design system + accessibility, 22 requirements) | Command Code | "Make it a consistent college-level system across login, dashboard, nav, pages, tables, forms, buttons, dialogs, toasts, cards, pagination, filters and status; meet 22 responsiveness/a11y/UX requirements; add no unnecessary dependencies." | Consolidated primitives (`index.css` tokens, `Button`, `Input`, `Field`, `Card`, `Alert`, `Badge`, `Modal`, `Spinner`/`Skeleton`, `ResourceTable`, `Pagination`, `ConfirmDialog`, `ErrorPage`, `DescriptionList`) reused by 30+ screens. | **Modified** — tokens instead of per-file colours; status badges carry a dot **and** text (never colour alone); the dialog became properly modal; added a skip link and real landmarks; two faults found were in the developer's own test scripts, not the app. | §Design pass — `npm test` 73/73 unchanged (no behaviour change); lint **0/0** across 113 files; **full API regression 63/63** |
| **Debugging** (diagnose → smallest fix) | Command Code | "Fix the failures below by diagnosing the root cause first, then applying the smallest correct change." | Root-cause fixes, not workarounds (see the per-bug list in the phase sections). | **Reviewed and applied** — each fix is tied to a reproducing failure and a passing test after it. | Bugs 1–6 below; e.g. `NODE_ENV` pinned to `test` (`vite.config.ts`); `axios.isAxiosError` handled first in `lib/errors.ts` |
| **Testing** (automated suite + live verification) | Command Code | "Implement the required automated tests: authentication flow, an API-integrated list, form validation/error handling, protected-route/authorization, and an end-to-end flow. Verify real behaviour; mock only the network." | `src/test/mockApi.ts` (swapped axios adapter), `fixtures.ts`, `renderApp.tsx`, four new suites, and a `console.error` guard. | **Modified** — mock the **network boundary**, not the api module, so URLs and query parameters are still exercised; kept two screen-state suites on `vi.mock` and recorded why. | §Laboratory test requirement — `npm test` **132/132 across 10 files** (re-run and confirmed); `scripts/verify-api.ps1` **129 live assertions** |

---

## Phase 1 — Project foundation (scaffold, routing, API client, error handling)

**Prompt used**

> Create the separate frontend project for Activity III: React + Vite + TypeScript, React Router,
> Axios, a clean folder structure, a configurable API base URL with a `.env.example`, no secrets, no
> database connection, no mock API, plus the router, layouts, reusable components, API service
> foundation, configuration, global styles and the error-handling foundation.

**AI suggestion**

- Scaffold with `create-vite` (`react-ts`) and add axios, react-router-dom, Tailwind v4 and Prettier.
- Layered structure: `types → lib → api → hooks → components → features`.
- One axios instance with request/response interceptors, rejecting a normalised `ApiError`.
- Failures normalised to `{ status, message, fieldErrors? }`.
- `useApiQuery` hook returning `{ data, loading, error, refetch }`.
- A `<DataState>` component for loading / error / empty / content.
- A Vite dev proxy so requests stay same-origin and CORS never applies.

**Accepted / Modified / Rejected:** **Modified** (kept the structure, changed four things)

| # | What the AI produced | What was done instead | Why |
| --- | --- | --- | --- |
| 1 | `baseURL = http://localhost:8000/api/v1` (absolute) | default `VITE_API_BASE_URL=/api/v1` (relative) | An absolute URL makes the browser call cross-origin, and the frozen backend only allows `http://localhost`. A relative path goes through the Vite proxy, so **no backend change is needed**. Both remain supported via the env var. |
| 2 | ESLint + Prettier config | Prettier kept; the template's **oxlint** kept instead of adding ESLint | The current Vite template ships oxlint and TypeScript 6. Adding ESLint would pull a toolchain that does not yet track TS 6 cleanly, for no functional gain. Prettier still applies the repository's formatting rules (double quotes, semicolons, 100 columns). Deviation recorded here on purpose. |
| 3 | Query parameters assembled with `URLSearchParams` from the raw form state | `lib/query.ts` with a **per-endpoint allow-list** | The backend silently ignores unsupported parameters, so a typo would fail silently. The allow-list (mirroring `FiltersAndSorts`) makes the supported set explicit and testable. |
| 4 | `loading`/`error` set inside the effect | `loading` **derived** from a request key | Avoids the cascading render flagged by `react(set-state-in-effect)`, and removes a class of race conditions when filters change quickly. |

**Also verified rather than assumed**

- The docs route `/api/docs.json` returns **500 when MySQL is down** (the documentation generator
  introspects the schema). Confirmed by calling the endpoint directly on port 8000, so it is not a
  proxy problem. Recorded in the README troubleshooting table.
- Vite binds to IPv6 `localhost` (`[::1]:5173`) on this machine, so `127.0.0.1:5173` is refused.
  Recorded in the README.
- `npm install` skipped every devDependency because the shell had `NODE_ENV=production`
  (`npm config get omit` → `dev`). Fixed with `npm install --include=dev`; recorded in the README.

**How it was verified**

| Check | Result |
| --- | --- |
| `npm run typecheck` (`tsc -b`) | clean, no errors |
| `npm run lint` (oxlint) | 0 warnings, 0 errors |
| `npm run build` | success (114 modules, `dist/` produced) |
| `GET http://localhost:5173/api/v1/ping` (through the proxy) | `200` with the real API payload |
| `GET http://localhost:5173/api/docs.json` and `/api/docs` | `200` (full stack, with MySQL running) |
| `GET http://localhost:5173/` | `200`, serves the SPA shell |
| Direct `GET http://127.0.0.1:8000/api/v1/ping` | `200` (baseline for comparison) |

**Endpoints touched in this phase:** `GET /api/v1/ping` only. All 42 routes are typed in `src/api/`
but the remaining screens arrive in later phases.

**Note on mock data**

`MSW` (Phase 11) will mock HTTP **inside tests only**. The running application never uses mock data,
which is why this phase's only screen reads from the live API and reports a connection failure
instead of displaying placeholder content.

---

## Phase 2 — Authentication

**Prompt used**

> Implement the complete frontend authentication system using the real authentication mechanism
> from the Activity I Laravel API: login page + form, loading state, validation, invalid-login
> handling, auth state, current-user retrieval, logout, protected routes, automatic handling of
> expired/invalid auth, 401 and 403 handling, and role-aware navigation. Do not assume JWT, do not
> invent endpoints. Test: valid login, invalid login, logout, protected page without login,
> expired/invalid authentication, forbidden role.

**AI suggestion**

- An `AuthContext` + `AuthProvider` holding `{ status, user, login, logout }`, with the token in
  `localStorage`.
- `RequireAuth` and `RequireRole` route guards.
- An axios response interceptor that reacts to 401 by clearing the session.
- Bootstrap by calling `/auth/me` when a token is present.
- A login form with client-side validation mirroring the backend rules.

**Accepted / Modified / Rejected:** **Modified** (the shape was right; five details changed after
checking the real backend and real behaviour)

| # | What the AI produced | What was done instead | Why |
| --- | --- | --- | --- |
| 1 | JWT-style assumptions (`access_token`, expiry decoding, refresh call) | Sanctum **opaque bearer token**; no expiry parsing, no refresh | This backend returns `data.token` + `token_type: "Bearer"`, `config/sanctum.php` sets `expiration => null`, and there is no refresh endpoint. Verified against the API contract. |
| 2 | Treat any 401 at bootstrap as "log out and clear the token" | Distinguish 401/403 (drop the token, show "session has ended") from a **network error** (keep the token so a reload can retry) | A momentary API outage should not destroy a valid session. |
| 3 | `sessionExpired` set only by the interceptor | Also set by the bootstrap `catch` | The interceptor never sees the failure when the API module is mocked in tests, and more importantly the intent ("the stored token was rejected") belongs to the provider, not to axios. |
| 4 | Navigation filtered inline in the layout | `navItemsForRole()` in `navigation.ts`, shared by the layout **and** the router guards | One source of truth for "which role sees which screen"; the same role lists feed `RequireRole`. |
| 5 | A login page only | Login page plus a **development-accounts panel** and a click-to-fill action | This is a graded demonstration; the seeded accounts are already public in the backend docs, and typing four passwords live wastes demo time. |

**Backend behaviour confirmed by testing (not assumed)**

- Wrong password and unknown email both return **422** with `errors.email` =
  "The provided credentials are incorrect." — verified by reading the raw response body. The form
  maps that straight onto the email field.
- A deactivated account returns **403** "This account is inactive." (`AuthController` checks
  `status !== 'ACTIVE'` before issuing a token).
- `POST /auth/logout` deletes **only the token used for that request** — verified by logging out
  one session and confirming another session's token still returns 200 on `/auth/me`.
- A revoked token returns **401** on `/auth/me`, which is what drives the "session ended" notice.

**How it was verified**

| Check | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm run lint` | 0 warnings, 0 errors |
| `npm run format:check` | clean |
| `npm run build` | success |
| `npm test` (Vitest + Testing Library) | **10 / 10 passing** |
| HTTP suite through the Vite proxy (23 checks) | **23 / 23 passing** |

The Vitest suite covers: protected route without a session, empty-form validation, successful
login + token stored, invalid credentials (API message + field error), session restore from a
stored token (refresh), invalid stored token cleared with an explanation, logout (session revoked
+ token cleared), 403 for a forbidden role, and role-aware navigation for student vs administrator.

The HTTP suite (run through `http://localhost:5173/api/v1/...`, i.e. the path the app really uses)
covers: valid login for all four roles, the token type, no password in the payload, invalid
password, unknown email, `/auth/me` with no token / invalid token / valid token, 403 for a student
listing students, 200 for a student reading their own record, 403 for another student's record,
instructor scoping, and logout revocation.

**One environment bug found and fixed**

`npm test` failed all 10 tests with `React.act is not a function` because the shell had
`NODE_ENV=production`, so React loaded its production build and Testing Library's `act()` shim
could not work. Fixed by pinning `test.env.NODE_ENV = "test"` in `vite.config.ts`, so the suite no
longer depends on the ambient environment. (Same root cause as the Phase 1 install issue.)

**Endpoints used in this phase:**
`POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`.
No endpoint was invented, and no backend file was changed.

---

## Centralised API service layer + reference data modules (Programs, Courses, Academic Terms)

**Prompt used**

> Implement the centralised API service layer and the core reference-data modules. First verify the
> exact endpoints from the real Laravel backend. Create reusable API functions instead of repeated
> axios calls. Implement centralised base URL, auth headers, common response/error handling and
> 401/403/404/409/422/500/network handling. Then implement Programs, Courses and Academic Terms with
> list, view, create, edit, delete/deactivate, forms, validation, loading/empty/error states,
> success feedback, confirmation for destructive actions, pagination and search/filter/sort where
> supported. Do not invent backend features.

**Verification first**

Before writing any code I re-read `routes/api.php`, the three controllers and the six Form Requests,
and confirmed the endpoint shapes, the query parameters each index accepts, the sort allow-lists and
the exact validation rules. Two things this changed:

- The academic-term route parameter is `{academic_term}` but the URL is `/academic-terms/{id}` -
  same shape as the others.
- `UpdateAcademicTermRequest` **drops** the `after:start_date` rule that the store request has. The
  client mirror now matches that exactly (checked on create, not on update) instead of being
  stricter than the server.

**AI suggestion / what was done**

| # | Suggestion | Decision | Why |
| --- | --- | --- | --- |
| 1 | Have mutation functions return the created/updated resource | **Changed** to return the full `{ success, message, data }` envelope uniformly | The success toast should show the API's own wording ("Program created successfully.") instead of a hard-coded string, and one rule for every call is easier to reason about. Callers that only want the payload use `unwrap`. |
| 2 | Duplicate a list page per module | **Extracted** `ResourceTable`, `ListToolbar`, `SearchInput`, `ConfirmDialog`, `PageHeader`, `DataState`, `useListQueryState`, `useFormState` | Three near-identical modules made the duplication obvious. The three list pages are now ~200 lines of configuration rather than ~200 lines of markup each. |
| 3 | Keep list state in component state | **Moved to the URL** via `useListQueryState` | Refresh keeps the view, the URL is shareable, and back/forward work. Sorting, searching and filtering all reset to page 1 so you never land on an empty page. |
| 4 | A `useAsyncAction` hook holding the error | **Deleted it**; forms and deletes use explicit `try/catch` with local state | `run()` returns `null` on failure, so reading `action.error` immediately afterwards can read a stale value. Catching directly made the 422-to-field mapping obviously correct. |
| 5 | Offer a "deactivate" endpoint | **Not invented** - there is none. `status: INACTIVE` on the edit form is the documented way to retire a record | §"Do not invent backend features". Also noted in the README, because a reader expects a deactivate button. |
| 6 | Show a success toast after delete | **Uses the API's message**, and the dialog shows the 409 verbatim | When the API refuses ("Cannot delete this program because students are assigned to it.") the reason is shown in the dialog, not swallowed. |

**Reusable layer, one place each**

`lib/http.ts` (instance + auth header + 401 seam) · `lib/errors.ts` (one `ApiError` for every
failure) · `lib/query.ts` (only backend-supported parameters) · `api/*.api.ts` (typed calls) ·
`hooks/useListQueryState.ts` (URL state) · `components/data/*` (table, states, pagination, dialogs) ·
`forms/useFormState.ts` + `validation/validators.ts` (client rules mirroring the Form Requests).

**Error coverage implemented and exercised**

| Status | Handling |
| --- | --- |
| 401 | session cleared once, redirect to /login with a notice |
| 403 | 403 page for a guarded route; inline message for an action. Instructors get a read-only list (no create/edit/delete buttons) |
| 404 | detail pages show "not found"; unknown URLs hit the 404 page |
| 409 | shown verbatim inside the delete dialog (record still in use) |
| 422 | merged under the matching field via `useFormState.applyServerErrors` |
| 500 | 500 page |
| network | "Cannot reach the API…" with a retry action |

**How it was verified** (run through the frontend's own proxy, so the exact app path is tested)

- `npm run typecheck`, `npm run lint` (0/0), `npm run format:check`, `npm run build` - all clean.
- `npm test` - 10/10 authentication tests still pass after the envelope refactor.
- **Live API suite: 64/64 checks passing** across the three modules - list (pagination, search,
  filter, sort, page 2), create 201 + message, show 200, update 200 + message + persisted value,
  422 on duplicate code / missing code / units out of range / end-before-start, 409 on deleting a
  record that is still in use, 404 after delete, and role scoping (instructor 200 on read, 403 on
  write; student 403 on list).

**Endpoints used:** the 15 routes of `/programs`, `/courses` and `/academic-terms`
(list, show, store, update, destroy for each). No endpoint was invented and no backend file changed.

---

## Students module (+ a real bug found in error handling)

**Prompt used**

> Implement the complete Student Management module using the real API: list with search, program /
> year-level / status filters, sorting and pagination; create, edit, delete/deactivate with
> confirmation; a detail page; error handling for 401/403/404/409/422/500/network. No hard-coded
> students.

**Verification first**

Re-read `StudentController`, `StoreStudentRequest`, `UpdateStudentRequest` and `StudentPolicy` before
writing anything. Confirmed the parameter names (`search`, `program_id`, `year_level`, `status`,
`sort`, `direction`, `page`, `per_page`), the searchable/sortable allow-lists, the exact validation
rules, and that instructors get `403` on **every** student ability while a student may read only
their own record.

**Decisions**

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| 1 | "Delete/deactivate" - which one? | **Both, using only real endpoints**: `DELETE` for permanent removal (with the 409 explained in the dialog) and `PUT {status}` for deactivate/reactivate | There is no deactivate endpoint and no soft delete. Using `status` is the backend-supported way to retire a record, so the UI offers it explicitly instead of pretending a delete succeeded. |
| 2 | Detail page structure | A **layout route** (`students/:id`) that loads the student once and shares it with four child tab routes via the outlet context | Switching tabs must not refetch the profile; the tabs are real URLs (`/students/1/grades`) so they can be linked and refreshed. |
| 3 | Tab pagination state | Local `useState`, not the URL | The nested endpoints accept only `page`/`per_page`; putting page state in the URL would leak between tabs. |
| 4 | Program filter + program field | A shared `useProgramOptions()` hook reading `GET /programs?per_page=100` | One request shape reused by the list filter and the form select. |

**A real bug the new tests caught**

While adding `src/lib/__tests__/errors.test.ts` I found that `isApiError()` also matched raw
**axios** errors: an `AxiosError` carries both a numeric `status` and a string `message`, so
`toApiError()` returned the axios error unchanged and the UI displayed axios's own text
("*Request failed*") instead of the API's message — for every single error, including 409 conflicts
and 422 validation failures. Fixed by checking `axios.isAxiosError()` first and by excluding
`isAxiosError` objects from `isApiError()`. Three of the eight new tests failed before the fix and
all pass after it.

**How it was verified**

- `npm run typecheck`, `npm run lint` (0/0), `npm run format:check`, `npm run build` — clean.
- `npm test` — **18/18** (10 authentication + 8 error-handling).
- **Live API suite: 56/56 checks** through the frontend's proxy, covering all fourteen required
  scenarios: list, search (name and student number), each filter and a combined filter,
  per_page/page, sort order actually verified against a client-side sort, create + API message +
  `full_name` composition, invalid data (missing first_name, bad email, unknown program,
  year_level 9, future birth date) each with the right `errors.<field>`, duplicate student number,
  edit (message, persisted value, program kept), deactivate/reactivate, delete blocked with 409,
  delete, 404 for the deleted and for an unknown id, 401 without/with a bad token, 403 for
  instructor and student, and a transport failure against a closed port.

**Endpoints used:** `GET|POST /students`, `GET|PUT|DELETE /students/{id}`,
`GET /students/{id}/enrollments`, `/grades`, `/academic-record`. No endpoint invented, no backend
change.

---

## Academic transaction modules (Course Offerings, Enrollments, Grades)

**Prompt used**

> Implement the academic transaction modules using only the real API contract: course offerings
> (list, view, create, edit, delete/deactivate, course/term/instructor selection, section, schedule,
> room, capacity, status), enrollments (list, create, student and offering selection, status, date,
> duplicate and invalid handling, student view, offering view) and grades (list, entry, edit,
> validation, authorized management, student view). Follow the backend's actual grade fields - do
> not invent names like `final_grade` if the API uses another. Role-aware behaviour must follow the
> real permissions. Hiding a button is not security.

**Verification first**

Re-read `StoreCourseOfferingRequest`, `StoreEnrollmentRequest`, `StoreGradeRequest`, `GradeResource`
and the three policies before writing code. Two findings worth recording:

- **The grade fields really are `midterm_grade` and `final_grade`.** The prompt warned about
  inventing `final_grade`, so I checked `GradeResource` and `StoreGradeRequest` explicitly: both
  fields exist under exactly those names, both `nullable|numeric|min:0|max:100`. Nothing was renamed
  and nothing invented.
- `instructor_id` is validated as a **user whose role is instructor** (`Rule::exists('users','id')
  ->where(role, instructor)`), which is why an admin id is rejected with a 422 rather than accepted.
- `GradePolicy` has no `create` method: creating a grade is authorized through
  `EnrollmentPolicy::grade` on the **enrollment**, so an instructor may grade only their own
  offering. The UI mirrors that; the API enforces it.

**Decisions**

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| 1 | Choosing an enrollment for a new grade | A **two-step** flow: pick the course offering, then pick a student from `GET /course-offerings/{id}/students` | `/enrollments` has no `search` parameter, so 100+ enrollments cannot be narrowed by name. A picker that ignored the search box would be misleading, so the second select's search box is disabled (`searchable={false}`). |
| 2 | Grade delete | **Not offered at all** | There is no `DELETE /grades/{id}`; offering it would be a lie. A hint explains that a grade is corrected by editing. |
| 3 | Instructor dropdown | Seeded-instructor constants (W1), with the field labelled *"seeded instructors - the API exposes no users endpoint"* | `/users` does not exist. Editing an offering shows the API's own `instructor` object instead of the constant. |
| 4 | Requiring at least one grade value | **Kept** (stricter than the server), and recorded here | The server accepts a grade with both fields empty, but a grade cannot be deleted and only one grade per enrollment is allowed - so creating an empty one would block the real grade. The client prevents it; the server's 422/409 still win when they disagree. |
| 5 | `RemoteSelect` component | One reusable remote-lookup select (debounced search, loading and error states) | Used for the student picker, both offering pickers and the list filters; four near-identical pickers would have been the alternative. |

**Verification**

- `npm run typecheck`, `npm run lint` (0/0), `npm run format:check`, `npm run build`, `npm test`
  (18/18) - all clean.
- **Live API suite: 73/73 checks** through the frontend's proxy, including the seven the prompt
  asked for: course-offering creation (201 + message), enrollment (201, default status `ENROLLED`),
  duplicate enrollment (409 with the API's wording), grade entry (201, `remarks` computed `PASSED`),
  invalid grade (`final_grade = 150` -> 422 `errors.final_grade`), unauthorized (401 without a
  token) and forbidden (403 for instructor and student writes, and for a second instructor
  attempting to grade someone else's class).
- Also verified: capacity **409** after filling an offering to its limit, offering edit reflected in
  the response, `PATCH /enrollments/{id}` status change, remarks recomputed to `FAILED` on a lower
  final grade, `DELETE /grades/{id}` returning **405** (proving the frontend is right not to offer
  it), 404s, and instructor scoping (`GET /course-offerings` as instructor 3 returned only their own
  rows).

**A bug in my own test, not the app:** the first capacity check failed because my loop fetched
students from `page=2..6` of a 100-per-page list, which is empty — so the offering never filled up.
Fixed by taking one pool of 100 students and the overflow student from page 2.

**Endpoints used:** the 15 offering/enrollment/grade routes plus `/course-offerings/{id}/students`.
No endpoint invented; no backend change.

---

## Dashboard, account page, academic record and the student portal

**Prompt used**

> Implement the remaining major features: a readable academic record page using the real endpoint
> (do not calculate or invent academic information), a profile/account page using actual backend
> capabilities, a role-appropriate dashboard built from real API data (no fake statistics), and
> role-aware navigation and pages for the four roles - following the backend's actual authorization
> rules, with the backend remaining the security boundary. Test all four roles, direct URL access to
> restricted pages, and 403 handling.

**What the backend actually allows (checked before building)**

- `GET /auth/me` is the **only** account endpoint: no profile update, no password change, no reset.
  So the account page is read-only and says why.
- There is **no statistics endpoint**. A dashboard figure can only come from `meta.total` of a
  collection request, which is why every figure is fetched with `per_page=1`.
- `GET /students/{id}/academic-record` already returns the record **grouped by term and sorted
  newest-first**, and includes the student. The page renders that shape rather than rebuilding it.
- Roles are the four in `User::ROLE_*`: `admin`, `registrar`, `instructor`, `student`. `isStaff()`
  is `admin || registrar`, which is why those two roles see identical navigation.

**Decisions**

| # | Question | Decision | Why |
| --- | --- | --- | --- |
| 1 | Should the academic record compute a GPA or term averages? | **No.** Only the fields the API returns are shown | The prompt forbids inventing academic information, and the API provides no GPA, average or term total. A count of listed courses per term is a UI count of returned rows, not academic maths. |
| 2 | Should the account page have an edit form? | **No** - read-only | There is no endpoint to update a user; an edit form would be fiction. The page states this and lists what the API holds. |
| 3 | Dashboards per role | **Three separate components** rendered by role, rather than one component with conditional figures | React cannot call hooks conditionally, and a student asking for `/students?per_page=1` would get a 403 - so a single component would have to fire requests it knows will fail. Splitting them means each role only requests what it may read. |
| 4 | Sharing the record/enrollment/grade views | The tab components take an optional `studentId` prop | The staff detail page passes nothing (it reads the route param); the portal passes `DEMO_STUDENT_ID`. One implementation, two entry points. |
| 5 | `useStudentDetail()` in the record tab | **Removed** - the tab now uses `record.student` from the API payload | The outlet context only exists on the staff route; the portal would have crashed reading it. The API already returns the student, so the context was unnecessary. |
| 6 | The old Phase-1 HomePage | **Deleted**, replaced by the dashboard | Two "home" screens would be confusing, and the dashboard proves connectivity better than a placeholder did. |

**A bug in my own test, not the app:** seven student checks failed with `404` where `403` was
expected. The API was right (a direct call returned 403) - my PowerShell used `"$endpoint?per_page=1"`,
which PowerShell parses as a variable named `endpoint?per_page`, producing a malformed URL. Fixed with
`"${endpoint}?per_page=1"`.

**How it was verified**

| Check | Result |
| --- | --- |
| `npm run typecheck` / `lint` / `format:check` / `build` | clean, 0 lint issues |
| `npm test` | **73/73** - 10 authentication + 8 error handling + **55 role-access and navigation tests** |
| Live API suite through the proxy | **69/69** |

The 55 component tests parametrise **every role × 13 guarded routes** (28 direct-URL cases plus nav
assertions), so a typed URL as a student renders the 403 page and the same URL as staff renders the
page. The live suite then proves the API refuses the same requests with real `403`/`401` responses:

- all four roles can read `/auth/me` (with no password field ever returned);
- admin and registrar: all seven collections → 200, and a registrar can create a student (201);
- instructor: six collections → 200, `/students` → 403, and their offering list contains **zero**
  rows belonging to another instructor;
- student: **all seven** collections → 403, own profile/enrollments/grades → 200, another student's
  profile/enrollments/record → 403;
- academic record: student's own → 200, another student's → 403, staff → 200; the payload carries the
  student, each term appears exactly once, each entry has course/section/schedule/status, and the
  terms arrive newest-first (verified by comparing against a client-side descending sort);
- no token on `/auth/me`, `/students` and the academic record → 401.

**Endpoints used:** `GET /auth/me` plus the collection and nested endpoints already in use. Nothing new
was invented and no backend file changed.

---

## Design consistency and accessibility pass

**Prompt used**

> Improve the whole frontend without changing the backend API: make it look like a complete
> college-level information management system with a consistent design across login, dashboard,
> navigation, header, pages, tables, forms, buttons, dialogs, notifications, cards, pagination,
> filters and status indicators. Meet 22 requirements covering responsiveness (desktop/tablet/mobile),
> spacing, typography, readable tables, form labels, accessible and keyboard-friendly controls,
> semantic HTML, never using colour alone for status, success/error messages, loading indicators,
> empty and network-error states, 403/404/401 pages, destructive confirmation, and prevention of
> duplicate submissions. Keep it professional but simple, add no unnecessary dependencies, and verify
> all existing API functionality still works.

**Approach**

Because nearly every screen is built from shared primitives, most of the improvement was made once in
the primitives and inherited by 30+ screens: `index.css` tokens, `Button`, `LinkButton`, `Input`,
`Field`, `Card`, `Alert`, `Badge`/`tones`, `Modal`, `Spinner`/`Skeleton`, `ResourceTable`,
`Pagination`, `ListToolbar`, `SearchInput`, `DataState`, `EmptyState`, `ErrorState`, `StatCard`,
`ConfirmDialog`, `ToastProvider`, plus `AppLayout` and a new shared `ErrorPage` and
`DescriptionList`.

**Decisions**

| # | Decision | Why |
| --- | --- | --- |
| 1 | Define the palette as Tailwind v4 `@theme` tokens (`brand-*`, `canvas`) instead of hard-coded `blue-*` in each file | One place to change colour; the audit shows 33 usages across 18 files all pointing at the tokens |
| 2 | **No new dependencies** | Tailwind, React Router and axios were already there; icons are inline SVG, so no icon package was added |
| 3 | Status badges carry a **dot plus the status text** | Requirement 12 - colour alone must never be the signal. The dot is `aria-hidden` so it is not read twice |
| 4 | The dialog became properly modal: focus moves in, returns to the trigger, Escape and backdrop close it | Keyboard users were previously left behind the overlay |
| 5 | A skip link and real landmarks (`header`/`nav`/`main`/`footer`) were added | Keyboard and screen-reader navigation on a data-heavy page |
| 6 | Extracted `DescriptionList`/`DescriptionItem` and an `ErrorPage` component | Five detail pages and three error pages each had their own copy of the same markup |
| 7 | The student form's fields are grouped in `<fieldset>` with `<legend>` | A long form is easier to navigate and to understand |
| 8 | `ResourceTable` gained an optional `caption`, and generic row actions got `aria-label`s naming the row ("Record a grade for Maria Santos") | A screen reader hearing five "Record grade" buttons cannot tell them apart |
| 9 | Buttons keep `min-h-10/11` | 40–44px touch targets for tablet and mobile |

**Two bugs found — both in my own test scripts, neither in the app**

- The student checks returned `404` where `403` was expected: PowerShell reads `"$endpoint?per_page=1"`
  as a variable named `endpoint?per_page`, producing a malformed URL. A direct API call returned 403,
  so the API was correct. Fixed with `"${endpoint}?per_page=1"`.
- In the regression script I treated the first student in the list as the demo student's profile and
  used a *nonexistent* id for "another student". A student is correctly refused (`403`) for someone
  else's record and correctly gets `404` for an id that does not exist. Fixed by using profiles 1
  (the demo student) and 2, and by separating the 403 and 404 cases.

**How it was verified**

| Check | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm run lint` | 0 warnings, 0 errors (113 files) |
| `npm run format:check` | clean |
| `npm test` | **73/73** — the existing authentication, error-handling and role-access suites still pass, so the redesign changed no behaviour |
| `npm run build` | succeeds |
| Built CSS contains the tokens | `bg-canvas`, `brand-600` and the skip-link utilities are all present (Tailwind does not error on unknown classes, so this was checked in `dist`) |
| **Full API regression through the proxy** | **63/63** — every module's create/update/delete, the 422/409/404/405/401 cases, dashboard `meta.total` readability, the academic record shape, and role scoping for all four roles |
| SPA routes | 13 routes including `/403`, `/portal/academic-record` and `/account` all serve |

The regression suite is the important one for this task: it proves the visual work did not disturb any
of the 42 API routes or the authorization behaviour.

---

## Testing and debugging pass

The frontend was tested against the running Laravel API and MySQL, not just type-checked. Two
runnable suites now exist:

- `scripts/verify-api.ps1` — 129 live assertions driven through the Vite proxy (`npm run dev` plus
  `php artisan serve`), covering every module, status code, role and edge case below.
- `npm test` — 114 jsdom tests, including four new suites: `src/__tests__/routing.test.tsx` (the
  **real** route table mounted with a memory history), `src/__tests__/dataStates.test.tsx`,
  `src/__tests__/layout.test.tsx` and `src/lib/__tests__/http.test.ts` (interceptor behaviour).

To let the routing suite exercise the real route table rather than a copy, `src/router.tsx` now
exports `routes` alongside the browser `router` it builds from it.

### Bugs found and fixed

| # | Bug | Why it mattered | Fix |
| --- | --- | --- | --- |
| 1 | A `200` whose body was not the API envelope was passed to the screen as data | A proxy or wrong base URL would render `undefined` fields with no error | The response interceptor now rejects a non-envelope body as an `ApiError` (`isApiEnvelope` in `lib/errors.ts`) |
| 2 | A stopped backend reached the app as `502` **with an empty body**, reported as "unexpected response format" | The real cause is unreachable API; the message sent the reader hunting for a data bug | `unexpectedResponseError()` maps a bodyless 5xx to the "cannot reach the API" message, and `errorTitle()` labels `502/503/504` the same way |
| 3 | `Card`, `PageHeader`, `Modal` and six page headers used `<header>` | A data-heavy page exposed several `banner` landmarks; a screen reader announces them all | Converted to `<div>`; the layout's own `<header>` is now the single banner (locked by a test) |
| 4 | The drawer's close button was rendered even while the drawer was closed | A control existed in the DOM that was not usable | Rendered only while the drawer is open, matching the backdrop |

### What the run also confirmed (no change needed)

- An outage of MySQL mid-session answers `500 Server error.` with the envelope — the user is **not**
  logged out, and the retry works once the database returns.
- A student is refused (`403`) by all seven list endpoints and by another student's nested records,
  while their own record returns `200` — matching the route guards.
- Instructors may list `/enrollments` and `/grades`, and the API silently scopes both to their own
  offerings (verified by checking every returned row's `course_offering.instructor_id`).
- `DELETE /grades/{id}` is `405`, duplicate enrollment and over-capacity are `409`, duplicate
  student number / program code / course code / term are `422`, and deletes answer `200` (never
  `204`) — the client handles all of these as written.
- Measured latencies for 100-row pages are 220–320 ms, comfortably inside the 20 s request timeout.

### Not verified here

Visual rendering at 375 / 768 / 1440 px needs a real browser: jsdom has no layout engine, so the
responsive tests assert the classes and the drawer's open/close behaviour, not the pixels.

---

## Laboratory test requirement: the automated suite

**Prompt used**

> Implement the automated frontend tests required by the laboratory: authentication flow, an
> API-integrated list or component, form validation/error handling, protected-route/authorization
> behaviour, and one important end-to-end flow if practical. Verify actual frontend behaviour, do not
> write tests that only check hardcoded values, mock external dependencies only, keep the real API for
> the manual demonstration, then run the suite, fix failures, run the production build and confirm
> there are no console or runtime errors.

**What was added**

| File | Purpose |
| --- | --- |
| `src/test/mockApi.ts` | HTTP-boundary test double: routes by method + path, records every request, throws on an unmocked endpoint |
| `src/test/fixtures.ts` | API-shaped factories (`makeStudent`, `makeProgram`, `makeUser`, login payload) |
| `src/test/renderApp.tsx` | Mounts the real route table and providers with a memory history |
| `src/features/students/__tests__/studentList.test.tsx` | 7 tests — the API-integrated list |
| `src/features/students/__tests__/studentForm.test.tsx` | 9 tests — validation and error handling |
| `src/__tests__/e2e.test.tsx` | 2 tests — the end-to-end journey |
| `src/test/setup.ts` | Fails any test that writes to `console.error`; restores the real adapter after each test |

**Decision: mock the network, not the api module.** The earlier suites replaced `../api` with
`vi.mock`, which meant a wrong URL or a dropped query parameter could not be caught. Swapping the
axios adapter exercises the api modules, interceptors, hooks and components for real, so the tests
can assert on the parameters that would have gone over the wire
(`api.last("get", "/students").params`), the payload that would be sent, and the `Authorization`
header. Two files (`routing.test.tsx`, `dataStates.test.tsx`) still mock the api module because they
are checking screen states rather than request construction; that is noted here so the difference is
deliberate rather than accidental.

**Bugs found and fixed**

| # | Bug | How it surfaced | Fix |
| --- | --- | --- | --- |
| 5 | "Clear filters" could not clear an active search: the pending debounced value was echoed back and re-applied itself to the URL | The list test typed a search, clicked Clear filters, and the next request still carried `search=nobody` | `SearchInput` now publishes a value only when the debounce has caught up with the box **and** differs from what the URL already holds; an outside reset is followed during render instead of in an effect |
| 6 | A second submit event during an in-flight request would have created a duplicate student | The form test forced a `submit` event while the POST was pending | `handleSubmit` in `StudentFormPage` returns early when a request is already in flight |

Bug 6 is fixed in the student form only; the other six forms rely on the disabled submit button
alone, which is what the browser's implicit submission respects. Recorded as such rather than
claimed as fixed everywhere.

**Verification**

| Check | Result |
| --- | --- |
| `npm test` | **132/132** across 10 files |
| `npm run typecheck` | clean |
| `npm run lint` | 0 warnings, 0 errors (123 files) |
| `npm run format:check` | clean |
| `npm run build` | succeeds — `dist/index.html`, `index-*.css` (32 kB), `index-*.js` (522 kB, 151 kB gzipped) |
| Production bundle served by `npm run preview` | `/`, both hashed assets and a deep link (`/students`) all return `200`; the API base path is inlined and no `process.env` reference leaked into the bundle |
| Console errors | none — enforced suite-wide, and the guard was proved to fail a test by deliberately logging an error once |
| Live API suite | still 129/129 (`scripts/verify-api.ps1`), unchanged by this work |

The `console.error` guard is worth calling out: it turns "looks fine in the output" into an
assertion, so a React warning introduced later fails the run instead of scrolling past.

**Limitations of the suite, stated plainly**

- jsdom has no layout engine and no real network: CSS breakpoints and long-poll/streaming behaviour
  cannot be tested here.
- The end-to-end flow is end-to-end *within the frontend* (routes, guards, pages, forms, toasts) with
  the network mocked. The genuine browser-to-Laravel-to-MySQL path is covered by
  `scripts/verify-api.ps1` for the manual demonstration, as the brief requires.
- `npm run preview` serves the build without the dev proxy, so API calls from a previewed build need
  a reverse proxy or an absolute `VITE_API_BASE_URL`. Expected, and now noted in the README.



