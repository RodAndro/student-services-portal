# student-web — Activity III Frontend

A **separate React application** that consumes the existing Student Information Management
**Laravel REST API** (Activity I) over real HTTP. It does not replace the backend, does not open a
database connection, and contains no mock API: every value on screen comes from an API response.

**Status:** complete — foundation, authentication, the centralised API layer, every resource module
(Programs, Courses, Academic Terms, Students, Course Offerings, Enrollments, Grades), the role-aware
dashboard and account page, and the student portal with the academic record view.

The running application contains **no mock data and no mock API**: every value on screen is rendered
from a real HTTP response returned by the Activity I Laravel REST API.

---

## Project purpose

Activity III asks for a **frontend integration with an existing REST API**: build the client, do not
rebuild the server. This repository is that client.

- It consumes the Activity I Laravel API over HTTP and renders what the API returns.
- It treats the **backend as the source of truth**: endpoints, parameter names, field names, status
  values and permissions are all taken from the real API, never invented.
- It treats the **backend as the security boundary**. The UI hides actions a role cannot perform, but
  the same request made directly is refused by the API with `403` — hiding a button is not security.
- It contains **no backend code, no database connection, no API routes and no mock API**.

## API base URL

Every request goes to `${VITE_API_BASE_URL}`, which defaults to **`/api/v1`**:

```
Browser  →  /api/v1/students        (relative → same origin)
                │
                ▼
        Vite dev proxy  /api/*  →  http://127.0.0.1:8000/api/*
                │
                ▼
        Laravel routes:  Route::prefix('v1')  →  /api/v1/students
```

A **relative** base URL is deliberate: the browser talks to its own origin, so CORS never applies and
the frozen backend needs no CORS change. Setting an **absolute** base URL calls the API directly
instead, which then requires `CORS_ALLOWED_ORIGINS` on the backend. See
[Environment variables](#environment-variables).

## Frontend technology

| Concern | Choice | Notes |
| --- | --- | --- |
| Language | **TypeScript** (strict) | compiled by `tsc -b` before every build |
| UI framework | **React 19** | function components and hooks only |
| Routing | **React Router 7** | `createBrowserRouter`; the route table is exported so tests mount the real routes |
| HTTP client | **Axios** | one shared instance in `src/lib/http.ts` |
| State management | **React Context + custom hooks** | `AuthProvider` / `ToastProvider`; no Redux / Zustand / React Query |
| Styling | **Tailwind CSS v4** | design tokens declared once in `src/index.css` (`@theme`) |
| Build tool | **Vite 8** | dev server with the `/api` proxy, production build to `dist/` |
| Testing | **Vitest + Testing Library** (jsdom) | see [Automated tests](#automated-tests) |
| Lint / format | **oxlint + Prettier** | double quotes, semicolons, 100 columns |

No component library, icon package, date library or state library was added — the extra
dependencies are just `axios` and `react-router-dom`.

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 18 or later (developed on 24) |
| npm | 9 or later |
| The Laravel API | running on `http://127.0.0.1:8000` |

Start the backend first (in `../student-api`): `php artisan serve`
(docs at `http://127.0.0.1:8000/api/docs` — they need MySQL running).

## Install and run

```bash
cd student-web
npm install            # if devDependencies are skipped, use: npm install --include=dev
npm run dev            # http://localhost:5173
```

### Production build

```bash
npm run build          # tsc -b && vite build → dist/
npm run preview        # serves dist/ on http://localhost:4173
```

`npm run preview` serves the built files **without** the dev proxy, so a previewed build needs a
reverse proxy in front of `/api` or an absolute `VITE_API_BASE_URL`; otherwise API calls fail while
the pages themselves still load.

## Environment variables

Copy `.env.example` to `.env` and adjust if needed. Only `VITE_`-prefixed variables reach the
browser, and **no secret belongs here** (everything is public in the client bundle).

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | API base URL. A **relative** path goes through the Vite dev proxy (same-origin, no CORS). An **absolute** URL such as `http://127.0.0.1:8000/api/v1` calls the API directly — the backend must then allow this origin via `CORS_ALLOWED_ORIGINS`. |
| `VITE_DEMO_STUDENT_ID` | `1` | Student profile id used by the student portal (Phase 9). See `docs/LIMITATIONS.md`. |

The app also works with **no `.env` file at all** — `src/config/env.ts` falls back to the same
defaults.

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 with the `/api` proxy |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only, no emit |
| `npm test` / `npm run test:watch` | Vitest + Testing Library (jsdom). `NODE_ENV` is pinned to `test` so the run does not depend on your shell. |
| `npm run lint` | oxlint |
| `npm run format` / `format:check` | Prettier (double quotes, semicolons, 100 columns) |
| `scripts/verify-api.ps1` | 129 live assertions against the real API through the dev proxy. Needs MySQL, `php artisan serve` and `npm run dev` running. |

## Automated tests

`npm test` runs Vitest with Testing Library in jsdom. **132 tests across 10 files.**

Everything except the network is real: the tests mount the exported route table
(`src/router.tsx`), the real auth provider, guards, pages, hooks and api modules. Only
the HTTP boundary is replaced, by swapping the axios adapter (`src/test/mockApi.ts`), so
the URL, the query parameters, the request body and the Authorization header are produced
by the application's own code — which is what most assertions check.

| File | What it covers |
| --- | --- |
| `src/auth/__tests__/authentication.test.tsx` | **Authentication flow**: sign-in, invalid credentials, sign-out and revocation, session restore after a refresh, 401/403 handling, network failure keeping the stored token, mid-session 401 ending the session |
| `src/auth/__tests__/roleAccess.test.tsx` | **Protected routes / authorization**: the route table and navigation for all four roles, direct URLs, 403 vs 404 |
| `src/__tests__/routing.test.tsx` | The real route table: 16 path/role combinations, unknown URLs, deep-link refresh |
| `src/features/students/__tests__/studentList.test.tsx` | **API-integrated list**: rows from the API, debounced search, filters, sorting, pagination, empty state, error + retry |
| `src/features/students/__tests__/studentForm.test.tsx` | **Form validation / error handling**: client rules, the API's 422 against the right field, the exact payload sent, duplicate-submission protection, edit prefill, 404 |
| `src/__tests__/e2e.test.tsx` | **End-to-end flow**: protected URL while signed out → sign in → search → open a record → delete with confirmation (including a 409 refusal) → sign out |
| `src/__tests__/dataStates.test.tsx` | Loading, empty, 403, 404, 409, 422, 500, gateway and malformed-response states |
| `src/__tests__/layout.test.tsx` | Shell, single `banner` landmark, responsive class contract, skip link |
| `src/lib/__tests__/errors.test.ts`, `src/lib/__tests__/http.test.ts` | Error normalisation and the interceptors (envelope check, 401 hook, timeout, transport failure) |

Three rules the suite follows:

1. **No assertions on hardcoded values in isolation.** Data comes from
   `src/test/fixtures.ts` in the shape the real resources use, and the query parameters
   under assertion are read back off the recorded request.
2. **The network is the only mock.** `installMockApi` routes by method and path and
   records every request; a call to an unmocked endpoint throws instead of returning
   `undefined`.
3. **Console errors fail the test.** `src/test/setup.ts` fails any test that writes to
   `console.error`, so React warnings and thrown render errors cannot pass unnoticed.

The live API is still exercised separately by `scripts/verify-api.ps1` (integration-style,
through the dev proxy) for the demonstration — the jsdom suite never talks to Laravel.

## Backend dependency

This frontend **cannot run on its own**. It is a client for the Activity I backend and depends on it
for every byte of data, for authentication, and for all authorization decisions.

| Dependency | Detail |
| --- | --- |
| Backend project | `../student-api` — Laravel 12 + Laravel Sanctum, API versioned under `/api/v1` |
| Local URL | `http://127.0.0.1:8000` (started with `php artisan serve`) |
| Database | MySQL, required by the backend (not touched by the frontend) |
| Start order | MySQL → `php artisan serve` (in `student-api/`) → `npm run dev` (in `student-web/`) |
| If the backend is down | Every screen shows "Cannot reach the API…" with a retry action; the sign-in screen reports the same |
| Contract reference | `../docs/API-CONTRACT.md` (the exhaustive backend contract this client is built against) |

**The backend was not modified.** No endpoint, controller, policy, migration or environment value in
`student-api/` was changed for Activity III. Browser requests stay same-origin through the Vite dev
proxy (see [How it talks to the API](#how-it-talks-to-the-api)), so the backend's CORS configuration
did not need to change either. Where the API genuinely lacks something, the frontend documents a
workaround instead of inventing an endpoint — see [Important limitations](#important-limitations).

## How it talks to the API

```
Browser (localhost:5173)
   │  axios, baseURL = /api/v1, Authorization: Bearer <token> when signed in
   ▼
Vite dev proxy  /api/*  ──►  http://127.0.0.1:8000/api/*
   ▼
Laravel API (unchanged)  ──►  MySQL (unchanged)
```

Because the browser only ever talks to `localhost:5173`, requests are **same-origin** and the API's
CORS rules are never involved — the frozen backend needs no configuration change. The proxy target
lives in `vite.config.ts`.

## Authentication

Implemented against the real backend mechanism — Laravel Sanctum **opaque bearer tokens, not JWT**.

| Action | Endpoint | Notes |
| --- | --- | --- |
| Sign in | `POST /api/v1/auth/login` | body `{ email, password }` → `data.token` + `data.user` |
| Current user | `GET /api/v1/auth/me` | used on load to restore the session |
| Sign out | `POST /api/v1/auth/logout` | revokes **only** the token used for that request |

- The token is attached by a request interceptor (`Authorization: Bearer <token>`) and kept in
  `localStorage`, so a browser refresh does not sign you out — on load the app re-checks it with
  `/auth/me`.
- **No refresh token and no expiry** (`config/sanctum.php` → `expiration => null`), so there is no
  silent-renew logic.
- **Wrong credentials** → `422` with `errors.email`; shown under the email field and as a form alert.
- **Inactive account** → `403` "This account is inactive."
- **Expired or revoked token** → any `401` clears the session once and returns to `/login` with the
  notice "Your session has ended" (`setUnauthorizedHandler` in `lib/http.ts`).
- **Forbidden role** → `RequireRole` renders the 403 page; the API answers `403` as well.
- **Role-aware navigation** → `navItemsForRole()` mirrors the backend policy matrix, and the router
  guards use the same role lists.
- This API has **no registration and no password reset**, so the login screen states that accounts
  are issued by the administrator.

Code: `src/auth/` (`context.ts`, `AuthProvider.tsx`, `useAuth.ts`, `RequireAuth.tsx`,
`RequireRole.tsx`) and `src/features/auth/LoginPage.tsx`.
Tests: `src/auth/__tests__/authentication.test.tsx` (10 cases).

## Reference data modules

Three complete modules are built on the shared API layer: **Programs**, **Courses** and
**Academic Terms**. Each one has a list, a detail view, a create/edit form, delete with
confirmation, and success feedback. Every operation maps to a real endpoint.

| Screen | Programs | Courses | Academic Terms |
| --- | --- | --- | --- |
| List | `GET /programs` | `GET /courses` | `GET /academic-terms` |
| Detail | `GET /programs/{id}` | `GET /courses/{id}` | `GET /academic-terms/{id}` |
| Create | `POST /programs` | `POST /courses` | `POST /academic-terms` |
| Edit | `PUT /programs/{id}` | `PUT /courses/{id}` | `PUT /academic-terms/{id}` |
| Delete | `DELETE /programs/{id}` | `DELETE /courses/{id}` | `DELETE /academic-terms/{id}` |

Collection features (only where the backend supports them — see `docs/API-INTEGRATION-MAP.md`):

| Feature | Programs | Courses | Academic Terms |
| --- | --- | --- | --- |
| Search | `search` (code, name) | `search` (code, title) | `search` (academic year) |
| Filters | `status` | `status` | `semester`, `status` |
| Sort | code, name, created_at, id | course_code, course_title, units, created_at, id | academic_year, semester, start_date, id |
| Pagination | `page`, `per_page` (max 100) | same | same |

**How the shared pieces fit together**

| Concern | Where |
| --- | --- |
| Base URL, auth header, one axios instance | `src/lib/http.ts`, `src/config/env.ts` |
| Error normalisation (401/403/404/409/422/500/network) | `src/lib/errors.ts` |
| Query parameters limited to the backend's allow-list | `src/lib/query.ts` |
| Typed calls returning the real envelope | `src/api/*.api.ts` |
| List state in the URL (search, sort, filters, page) | `src/hooks/useListQueryState.ts` |
| Table + mobile cards, sortable headers | `src/components/data/ResourceTable.tsx` |
| Loading / empty / error / content | `src/components/data/DataState.tsx` |
| Destructive-action confirmation | `src/components/data/ConfirmDialog.tsx` |
| Success feedback (uses the API's own message) | `src/components/feedback/ToastProvider.tsx` |
| Form state + server 422 merge | `src/forms/useFormState.ts` |
| Client rules mirroring the Form Requests | `src/validation/validators.ts`, `src/features/*/…Rules.ts` |

**Deactivate rather than delete:** this API has no soft delete and no deactivate endpoint. The way
to retire a program, course or term is to set `status` to `INACTIVE` on the edit form. `DELETE`
removes the row permanently, and the API refuses it (409) while dependent records exist.

## Students module

The fullest module: a searchable list, a detail page with four tabs, full create/edit, and
deactivate or delete. Every value comes from the API — there is no hard-coded student anywhere.

**List parameters — the exact names `StudentController` accepts**

| Control | Parameter | Allowed values |
| --- | --- | --- |
| Search box | `search` | partial match on first_name, middle_name, last_name, student_number, email |
| Program filter | `program_id` | an existing program id (options loaded from `GET /programs`) |
| Year-level filter | `year_level` | 1–4 |
| Status filter | `status` | `ACTIVE` / `INACTIVE` |
| Sortable columns | `sort` + `direction` | last_name, first_name, student_number, year_level, created_at, id |
| Pagination | `page`, `per_page` | per_page 1–100 (default 15) |

**Endpoints**

| Screen | Endpoint |
| --- | --- |
| List / create | `GET`, `POST /students` |
| Detail (Profile tab) | `GET /students/{id}` |
| Edit | `PUT /students/{id}` |
| Delete | `DELETE /students/{id}` — refused with **409** while enrollments exist |
| Enrollments tab | `GET /students/{id}/enrollments` (`page`, `per_page` only) |
| Grades tab | `GET /students/{id}/grades` (`page`, `per_page` only) |
| Academic Record tab | `GET /students/{id}/academic-record` (**not paginated**, grouped by term) |

**Deactivate or delete?** This API has no deactivate endpoint and no soft delete. Two real options
are offered, both using the backend as-is:

- **Deactivate / Reactivate** → `PUT /students/{id}` with `{ "status": "INACTIVE" }` (or `ACTIVE`).
  The record is kept; this is the recommended way to retire a student.
- **Delete** → permanent. Confirmed in a dialog, and if the student still has enrollments the API
  answers **409** with *"Cannot delete this student because they have enrollments."* — shown
  verbatim in the dialog.

**Who can do what:** `StudentPolicy` gives admin/registrar full access, refuses instructors
completely (`403` on every ability) and lets a student read only their own record. The route guard
mirrors that: the whole `/students` branch is admin/registrar only, so an instructor never sees the
menu entry.

## Academic transaction modules

### Course Offerings

| Feature | Endpoint | Notes |
| --- | --- | --- |
| List | `GET /course-offerings` | `search` (section, schedule, room), `course_id`, `academic_term_id`, `instructor_id`, `status`, `sort`, `direction`, `page`, `per_page` |
| Detail + class list | `GET /course-offerings/{id}` and `GET /course-offerings/{id}/students` | the class list accepts `page`/`per_page` only |
| Create / edit | `POST /course-offerings`, `PUT /course-offerings/{id}` | fields: `course_id`, `academic_term_id`, `instructor_id`, `section`, `schedule`, `room`, `capacity` (1–500), `status` |
| Delete | `DELETE /course-offerings/{id}` | **409** while the offering has enrollments |

`instructor_id` must belong to a user whose role is `instructor` — the API enforces it and the select
only offers valid choices (see W1 in `docs/LIMITATIONS.md`). An instructor sees **only their own**
offerings, because the server scopes the query; the screen says so instead of looking like a filter
the user set. "Deactivate" here means `status: INACTIVE` on the edit form.

### Enrollments

| Feature | Endpoint | Notes |
| --- | --- | --- |
| List | `GET /enrollments` | filters `student_id`, `course_offering_id`, `status`; **no `search` parameter** — so there is no search box |
| Create | `POST /enrollments` | body `student_id` + `course_offering_id` (+ optional `enrollment_date`, `status`). There is no nested route |
| Edit / delete | `PATCH /enrollments/{id}`, `DELETE /enrollments/{id}` | |
| Student's view | `GET /students/{id}/enrollments` | the Student detail → Enrollments tab |
| Offering's view | `GET /course-offerings/{id}/students` | the offering's class list |

**409s are shown verbatim**, because they say exactly what happened:
*"The student is already enrolled in this course offering."* or
*"This course offering has reached its capacity."* Invalid references come back as **422** and land
under the matching field.

### Grades

| Feature | Endpoint | Notes |
| --- | --- | --- |
| List | `GET /grades` | only the `enrollment_id` filter exists plus sort/pagination; instructors are scoped to their own offerings |
| Record | `POST /grades` | the real field names are **`midterm_grade`** and **`final_grade`** (`nullable|numeric|min:0|max:100`). **409** if the enrollment already has a grade |
| Edit | `PUT /grades/{id}` | |
| Delete | — | **there is none.** `GradeController` has no `destroy` and the route is registered `->except(['destroy'])`. A wrong grade is corrected by editing it |

`remarks` is **computed by the server** (`IN PROGRESS` without a final grade, `PASSED` at 75+,
`FAILED` below) — it is never sent in the request. The form shows a preview of what the API will
store, and the saved value always comes back from the API.

**Choosing an enrollment for a grade** is a two-step flow (pick the course offering, then pick a
student from that offering's class list), because `/enrollments` cannot be searched. Arriving from an
offering's class list (`/grades/new?enrollment_id=…`) skips both steps, and the form detects an
existing grade and links to its edit screen instead of letting you hit a 409.

**Role rules follow the policies exactly**

| Action | admin / registrar | instructor | student |
| --- | --- | --- | --- |
| Offers/enrollments: create, edit, delete | ✅ | ❌ 403 | ❌ 403 |
| Offers/enrollments/grades: list | ✅ all | ✅ **own offerings only** | ❌ 403 |
| Grade create/edit | ✅ any | ✅ own offerings only | ❌ 403 |
| Own grades/enrollments read | ✅ | ✅ | ✅ (`/students/{ownId}/…`) |

The buttons are hidden where a role cannot act, but that is only cosmetic: the API is the
authorization boundary, and a direct request is refused with **403** (verified in the test run).

## Dashboard, account and academic record

### Dashboard (`/`) — role-aware

Every figure is `meta.total` from a real collection endpoint requested with `per_page=1`, because the
backend has **no statistics endpoint**. Where a role cannot read a collection, that figure is simply
not shown — nothing is estimated or hard-coded.

| Role | Sees |
| --- | --- |
| Administrator / Registrar | counts of students, programs, courses, academic terms, course offerings, enrollments, grades + the five most recent enrollments |
| Instructor | counts of **their own** offerings, enrollments and grades (the API scopes all three) + their five most recently recorded grades |
| Student | own enrollments and grades counts, plus their program and year level |

### Account (`/account`) — all roles

Reads `GET /auth/me` and shows the account details the API holds, plus a summary of what the signed-in
role may do (mirroring the policies). It is **read-only on purpose**: the API has no endpoint to edit a
user, change a name/email/role, or reset a password, so there is no edit form to invent.

### Academic record — staff tab and student portal

`GET /students/{id}/academic-record` is **not paginated**: the API groups the student's enrollments by
academic term and sorts them newest-first. The screen renders exactly that structure — course, section,
schedule, enrollment status, midterm, final and the server-computed remarks — organised into one card
per term. It adds **no academic maths of its own** (no GPA, no averages, no term totals) because the
API does not provide them.

Reached from two places, sharing one component:

- staff: **Students → a student → Academic Record**
- student: **My Academic Record** (`/portal/academic-record`)

### Roles

The backend implements four roles (`admin`, `registrar`, `instructor`, `student`) and the UI follows
the policies exactly — no invented roles, no assumed permissions:

| Role | Navigation |
| --- | --- |
| Administrator | Dashboard · Programs · Courses · Academic Terms · Students · Course Offerings · Enrollments · Grades · My Account |
| Registrar | identical to the administrator (both are "staff" to the policies) |
| Instructor | Dashboard · Programs · Courses · Academic Terms · Course Offerings · Enrollments · Grades · My Account (no Students) |
| Student | Dashboard · My Profile · My Enrollments · My Grades · My Academic Record · My Account |

Hiding a link is presentation only. The same role lists drive the router guards, so a typed URL is
refused with the **403 page**, and the API refuses the underlying request with `403` as well — verified
in both directions (component tests for the guards, live requests for the API).

## Design system and accessibility

The look is defined once and reused everywhere, so screens stay consistent without a CSS framework
beyond Tailwind (no extra dependencies were added).

**Foundations**

| Element | Where it is defined | Consequence |
| --- | --- | --- |
| Colour, font, page background | `src/index.css` (`@theme` tokens: `brand-*`, `canvas`) | one palette; primary actions, links and the active nav item all use `brand-600/700` |
| Focus ring | `index.css` (`:focus-visible`) plus per-component rings | every control shows the same visible focus indicator for keyboard users |
| Buttons | `components/ui/Button.tsx`, `LinkButton.tsx` | 4 variants × 2 sizes, all ≥40px tall; disabled + `aria-busy` while submitting |
| Inputs, selects, textareas | `components/ui/Input.tsx` | identical borders, padding, focus ring and error styling |
| Labels, hints, errors | `components/ui/Field.tsx` | every control is labelled; error text uses `role="alert"` |
| Cards / panels | `components/ui/Card.tsx` | same surface, border, radius, shadow and header treatment |
| Status pills | `components/ui/Badge.tsx` + `tones.ts` | **status text plus a dot** - never colour alone |
| Messages | `components/ui/Alert.tsx` | info / success / warning / danger each carry an icon as well as a colour |
| Dialogs | `components/ui/Modal.tsx` | `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape and backdrop close, focus moves in and returns |
| Tables | `components/data/ResourceTable.tsx` | sticky header, sortable column buttons with `aria-sort`, optional `<caption>`; each row becomes a labelled card below `lg` |
| Pagination, filters, search | `components/data/{Pagination,ListToolbar,SearchInput}.tsx` | one toolbar, one pager, labels on every control |
| Toasts | `components/feedback/ToastProvider.tsx` | `aria-live` region, dismiss button, icon + text |
| Confirmation | `components/data/ConfirmDialog.tsx` | destructive actions always confirm, and the API's 409 is shown inside the dialog |

**The 22 requirements, and where each is met**

1–3 **Responsive** — `lg+` shows a permanent sidebar and real tables; below `lg` the sidebar becomes
a drawer with a backdrop and each table row becomes a labelled card. Forms are single-column on
phones and two-column from `sm`. Wide tables scroll horizontally rather than squashing.
4 **Spacing** — page padding `px-4 sm:px-6 lg:px-8`, `space-y-6` between sections, consistent card and
control padding.
5 **Typography** — one scale: page title `text-xl`, card title `text-sm semibold`, body `text-sm`,
meta `text-xs`, tabular numbers for figures.
6 **Buttons** — 4 variants, clear primary/secondary/danger hierarchy, ≥40px targets.
7 **Tables** — sticky headers, zebra-free hover rows, `aria-sort`, horizontal scroll when needed,
cards on small screens.
8 **Form labels** — `<label for>` on every input; required fields marked with `*` **and** an
`sr-only` "(required)".
9 **Accessible controls** — `aria-invalid` on failing fields, `aria-describedby` hints, `role="alert"`
on errors, labels on icon-only buttons.
10 **Keyboard** — skip link, visible focus everywhere, Escape closes dialogs and the drawer, focus
returns to the trigger, dialogs are focusable.
11 **Semantic HTML** — `header`/`nav`/`main`/`footer` landmarks, `table`/`thead`/`th scope`, `fieldset`
grouping in the student form, `dl` for details.
12 **No colour-only status** — every badge shows the status text plus a dot; error/success/info states
have icons and words.
13 **Success messages** — toasts that use the API's own message ("Student created successfully.").
14 **Error messages** — the API's message verbatim, plus field-level errors under the inputs.
15 **Loading** — spinners in buttons, skeleton blocks for lists, `role="status"` labels.
16 **Empty states** — icon, explanation and the action that makes sense.
17 **Network errors** — "Cannot reach the API. Make sure the Laravel server is running…" with Retry.
18 **403 page** — explains the role restriction and offers the right next step (students go to their
portal).
19 **404 page** — same layout, back to the dashboard.
20 **401** — the session is cleared once, the user lands on the login screen with "Your session has
ended".
21 **Destructive confirmation** — deleting always asks first, and shows why the API refused (409).
22 **No double submission** — the submit/dialog buttons disable and show a spinner while the request
is in flight, and buttons default to `type="button"` so nothing submits by accident.

## Folder structure

```
student-web/
├── .env.example            # documented environment variables
├── vite.config.ts          # React + Tailwind plugins and the /api proxy
├── tsconfig*.json          # strict TypeScript, matching the repository style
└── src/
    ├── main.tsx            # entry point (ErrorBoundary + App)
    ├── App.tsx             # RouterProvider
    ├── router.tsx          # routes: layout, overview, 403, 404, error element
    ├── index.css           # Tailwind v4 entry + global styles
    ├── config/env.ts       # typed environment access
    ├── types/api.ts        # every API resource, envelope and list-parameter type
    ├── lib/
    │   ├── http.ts         # the single axios instance + interceptors
    │   ├── errors.ts       # normalises every failure into one ApiError shape
    │   ├── storage.ts      # token/session persistence (used from Phase 2)
    │   ├── query.ts        # builds only the query parameters the API supports
    │   └── format.ts       # dates, statuses, grades
    ├── api/                # one typed module per resource (all 42 real routes) + unwrap helper
    ├── auth/               # context, provider, useAuth, RequireAuth, RequireRole
    ├── hooks/              # useApiQuery, useListQueryState, useDebouncedValue, useReferenceOptions
    ├── forms/              # useFormState (values, errors, server 422 merge)
    ├── validation/         # validators mirroring the Form Request rules
    ├── components/
    │   ├── layout/         # AppLayout, PageHeader, navigation config
    │   ├── ui/             # Button, LinkButton, Input, Field, Card, Alert, Badge, Modal, Spinner, Skeleton, tones
    │   ├── data/           # DataState, EmptyState, ErrorState, Pagination, ResourceTable, SearchInput, ListToolbar, ConfirmDialog
    │   ├── feedback/       # ToastProvider + useToast
    │   └── ErrorBoundary.tsx
    ├── features/
    │   ├── dashboard/        # role-aware dashboard (staff / instructor / student)
    │   ├── account/          # read-only account page (GET /auth/me)
    │   ├── portal/           # student portal: profile, enrollments, grades, academic record
    │   ├── programs/         # list, detail, form, rules
    │   ├── courses/          # list, detail, form, rules
    │   ├── academic-terms/   # list, detail, form, rules
    │   ├── students/         # list, form, detail + tabs, profile card, rules
    │   ├── course-offerings/ # list, form, detail with class list, rules
    │   ├── enrollments/      # list, form, rules
    │   └── grades/           # list, form (create two-step or prefilled, edit), rules
    └── pages/                # Forbidden (403), NotFound (404), ServerError (500)
```

## Error handling

Every failure is normalised by `src/lib/errors.ts` into `{ status, message, fieldErrors? }`, so the
UI always shows the API's own wording instead of a raw exception:

| Status | Behaviour |
| --- | --- |
| `401` | clears the session and redirects to the login screen (wired in Phase 2) |
| `403` | 403 page or inline message |
| `404` | "record not found" panel (or the 404 page for an unknown URL) |
| `409` | the API's message is shown verbatim (duplicate enrolment, capacity, delete blocked) |
| `422` | field errors mapped under the matching inputs |
| `500` | the 500 page with a retry link |
| network | "Cannot reach the API. Make sure the Laravel server is running…" |

`ErrorBoundary` catches render-time bugs; `DataState` renders the loading / empty / error / content
branches for every data screen.

## Important limitations

Because the backend is frozen (see [Backend dependency](#backend-dependency)), some things a reader
might expect are genuinely absent. They are summarised here and explained in full in
[`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

| # | Limitation | How the UI handles it |
| --- | --- | --- |
| W1 | There is **no users/instructors endpoint**, so the course-offering instructor dropdown has no data source | The three seeded instructors (ids 3, 4, 5) are used, and the field is labelled as seeded data |
| W2 | There is **no "my profile" endpoint**, so a student cannot discover their own `students.id` | The portal uses `VITE_DEMO_STUDENT_ID` (default `1`); a mismatch surfaces the API's `403` with an explanation |
| L1 | **No deactivate endpoint and no soft delete** | "Deactivate" is offered as `PUT { status: "INACTIVE" }`; `DELETE` is permanent and refused with `409` while dependents exist |
| L2 | **Grades cannot be deleted** (no `DELETE /grades/{id}`) | No delete action is shown for grades; a wrong grade is corrected by editing |
| L3 | `/enrollments` and `/grades` have **no `search` parameter** | Those lists filter by id/status only; recording a grade is a two-step picker (offering → student) |
| L4 | Lookup lists are **capped at 100 rows** (`per_page ≤ 100`) | The student picker searches remotely; other selects load up to 100 options |
| L5 | Nested relations are **omitted when not eager-loaded** (`whenLoaded`) | Every nested object is treated as optional and rendered as `—` when absent |
| L6/L7 | Unknown `sort` values fall back silently; filters are **exact-match** and sorting is **single-column** | The UI only offers allow-listed sort columns and equality filters, so unsupported parameters are never sent |
| L8/L9 | `GET /ping` proves liveness, not readiness; a stopped backend arrives as a proxy `502` with an empty body | Both are reported as "cannot reach the API" rather than as a data error |

Other deliberate absences: **no registration, no password reset, no profile editing, no statistics
endpoint** (dashboard figures are `meta.total` from real collections), and **no CI configuration or
container files** in this repository.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `npm install` installs nothing but `axios` | Your shell has `NODE_ENV=production`, so npm skips devDependencies. Run `npm install --include=dev`. |
| `http://127.0.0.1:5173` refuses to connect | Vite binds to `localhost` (IPv6 `::1` on some machines). Use `http://localhost:5173`. |
| The overview screen shows "Cannot reach the API" | The Laravel server is not running. Start it with `php artisan serve`. |
| `http://localhost:8000/api/docs` returns 500 | The API documentation generator introspects the database, so **MySQL must be running**. The API itself still works. |

## Documentation

| File | Contents |
| --- | --- |
| [`docs/API-INTEGRATION-MAP.md`](docs/API-INTEGRATION-MAP.md) | Every screen → the real endpoint it calls (method, purpose, auth, role) |
| [`docs/AI-DEVELOPMENT-LOG.md`](docs/AI-DEVELOPMENT-LOG.md) | Task table plus per-phase prompt → AI result → review → evidence |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | The browser → React → API service → Laravel → MySQL flow and how each layer behaves |
| [`docs/TEST-EVIDENCE-CHECKLIST.md`](docs/TEST-EVIDENCE-CHECKLIST.md) | The screenshots and terminal evidence to capture for the laboratory submission |
| [`docs/ACTIVITY-III-COMPLIANCE.md`](docs/ACTIVITY-III-COMPLIANCE.md) | Laboratory requirement → implementation mapping, with honest status labels |
| [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) | The frontend-only workarounds and backend limitations, explained in full |
| [`../docs/API-CONTRACT.md`](../docs/API-CONTRACT.md) | The full backend contract this app is built against |
