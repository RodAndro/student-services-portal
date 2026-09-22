# Activity III — Compliance Checklist

Requirement-by-requirement status for the **Activity III frontend** (`student-web`), the React client
for the Activity I Laravel REST API.

## How to read this, and an honesty note

**The official Activity III requirements document is not in this repository.** It was looked for and
is absent — the same finding is recorded in `../docs/BACKEND-VS-ACTIVITY-III.md`, which states the
specification "has NOT been provided". This checklist therefore maps against two things that *are*
documented and verifiable:

1. the deliverables explicitly requested for this activity (frontend + integration + the six
   documents), and
2. the requirements evident throughout the project's own documentation (the automated-test
   requirement in `AI-DEVELOPMENT-LOG.md`, the role/error/security expectations in the backend's
   `compliance-checklist.md`, and the frozen-backend rule).

**Nothing here is marked complete unless it can be shown in the code, a test, or a build.** Where a
requirement needs a screenshot that has not been taken yet, it is marked **⏳ EVIDENCE PENDING**,
not complete. Where the backend genuinely cannot support something, it is marked honestly and the
workaround is named — not hidden.

**Status legend:** ✅ DONE (implemented and verifiable in the repo) · 🟡 DONE WITH A DOCUMENTED
LIMITATION · ⏳ IMPLEMENTED, EVIDENCE STILL TO CAPTURE · ❌ NOT IMPLEMENTED · ❓ NEEDS THE SPEC.

---

## 1. Deliverable documents

| # | Requirement | Status | Where / note |
| --- | --- | --- | --- |
| 1.1 | **README.md** with title, purpose, frontend technology, requirements, installation, environment configuration, API base URL, dev command, production build, testing, troubleshooting, backend dependency, authentication, roles, important limitations | ✅ DONE | `student-web/README.md` — all listed sections present |
| 1.2 | **API Integration Map** (feature → endpoint → method → purpose → auth → role) | ✅ DONE | `docs/API-INTEGRATION-MAP.md`; every row taken from `src/api/*` and the backend routes/controllers/policies |
| 1.3 | **AI Development Log** (task → tool → prompt → result → human review → evidence) | ✅ DONE | `docs/AI-DEVELOPMENT-LOG.md`; summary table plus per-phase detail |
| 1.4 | **Architecture Note** (Browser → React → API service → Laravel → DB, plus auth/authz/calls/state/errors/role-aware UI) | ✅ DONE | `docs/ARCHITECTURE.md` |
| 1.5 | **Test Evidence Checklist** | ✅ DONE | `docs/TEST-EVIDENCE-CHECKLIST.md` |
| 1.6 | **Activity III Compliance Checklist** (this file) | ✅ DONE | `docs/ACTIVITY-III-COMPLIANCE.md` |

## 2. Frontend project and integration

| # | Requirement | Status | Where / evidence |
| --- | --- | --- | --- |
| 2.1 | A separate frontend application that consumes the REST API over real HTTP | ✅ DONE | `student-web/` (React + Vite + TS); no DB connection, no mock API in app code |
| 2.2 | Configurable API base URL, no secrets in the client | ✅ DONE | `VITE_API_BASE_URL` (default `/api/v1`) in `src/config/env.ts`; `.env` gitignored, `.env.example` has placeholders only |
| 2.3 | Centralised API service layer (no scattered HTTP calls) | ✅ DONE | `src/lib/http.ts`, `src/lib/errors.ts`, `src/lib/query.ts`, one module per resource in `src/api/` |
| 2.4 | Only real endpoints used; nothing invented | ✅ DONE | `docs/API-INTEGRATION-MAP.md`; `students-api` etc. map 1:1 to backend routes |
| 2.5 | Backend left unmodified (frozen) | ✅ DONE | No change made in `student-api/`; same-origin via the Vite proxy so CORS needed no change either |
| 2.6 | Production build produced without errors | ✅ DONE | `npm run build` (`tsc -b && vite build`) — capture in evidence B3 |
| 2.7 | Dev proxy so browser requests are same-origin | ✅ DONE | `vite.config.ts` proxies `/api` → `127.0.0.1:8000` |

## 3. Authentication and authorization

| # | Requirement | Status | Where / evidence |
| --- | --- | --- | --- |
| 3.1 | Login with the API's real mechanism (Sanctum bearer tokens, not JWT) | ✅ DONE | `AuthProvider.login` → `POST /auth/login`; token in `localStorage` |
| 3.2 | Session restore on refresh | ✅ DONE | `GET /auth/me` on load; test "session restore" |
| 3.3 | Logout that revokes the token | ✅ DONE | `POST /auth/logout`; test 13/13 in `authentication.test.tsx` |
| 3.4 | Protected routes (unauthenticated → login) | ✅ DONE | `RequireAuth`; `routing.test.tsx` + `roleAccess.test.tsx` |
| 3.5 | Invalid-credential and inactive-account handling | ✅ DONE | `422`/`403` shown from the API's own messages |
| 3.6 | Centralised `401` handling | ✅ DONE | `setUnauthorizedHandler` in `lib/http.ts`; "session ended" notice |
| 3.7 | Role-aware navigation for all four roles | ✅ DONE | `navigation.ts` single source; `roleAccess.test.tsx` (55 tests) |
| 3.8 | Direct URL to a forbidden page → 403 | ✅ DONE | `RequireRole` → `ForbiddenPage`; parametrised tests over roles × routes |
| 3.9 | Authorization enforced by the server, not the UI | ✅ DONE | Policies on the backend; live `403` assertions in `verify-api.ps1` |
| 3.10 | Registration / sign-up | ❌ NOT IMPLEMENTED | **The API has no registration endpoint.** Out of scope unless the spec requires it; the login screen says accounts are issued by the administrator |
| 3.11 | Password change / reset | ❌ NOT IMPLEMENTED | **The API has no such endpoint**; the account page is read-only and says so |

## 4. Feature coverage (per resource)

| # | Module | Status | Endpoints (all real) |
| --- | --- | --- | --- |
| 4.1 | Programs | ✅ DONE | `GET/POST /programs`, `GET/PUT/DELETE /programs/{id}` |
| 4.2 | Courses | ✅ DONE | same shape as programs |
| 4.3 | Academic Terms | ✅ DONE | same shape as programs |
| 4.4 | Students | ✅ DONE | `/students` CRUD + `/students/{id}/{enrollments,grades,academic-record}` |
| 4.5 | Course Offerings | ✅ DONE | `/course-offerings` CRUD + `/course-offerings/{id}/students` |
| 4.6 | Enrollments | ✅ DONE | `GET/POST /enrollments`, `GET/PATCH/DELETE /enrollments/{id}` |
| 4.7 | Grades | ✅ DONE | `GET/POST /grades`, `GET/PUT /grades/{id}` (**no delete — endpoint does not exist**) |
| 4.8 | Student portal (own profile / enrollments / grades / record) | 🟡 DONE WITH A DOCUMENTED LIMITATION | Uses `VITE_DEMO_STUDENT_ID` because there is no "my profile" endpoint (W2, `LIMITATIONS.md`) |
| 4.9 | Academic record grouped by term | ✅ DONE | `GET /students/{id}/academic-record`, rendered as-is (no GPA invented) |
| 4.10 | Role-aware dashboard from real data | 🟡 DONE WITH A DOCUMENTED LIMITATION | Figures are `meta.total` from real collections; there is **no statistics endpoint** |
| 4.11 | Account page | ✅ DONE | `GET /auth/me`; read-only by design |
| 4.12 | User management / role assignment UI | ❌ NOT IMPLEMENTED | **No users endpoint exists** (`GET /users` → 404) |
| 4.13 | Instructor dropdown for course offerings | 🟡 DONE WITH A DOCUMENTED LIMITATION | Seeded-instructor constants (W1, `LIMITATIONS.md`) because there is no users endpoint |

## 5. Data, states and errors

| # | Requirement | Status | Where / evidence |
| --- | --- | --- | --- |
| 5.1 | Search on list screens | 🟡 DONE WHERE SUPPORTED | Supported on programs/courses/terms/students/offerings; **not** on enrollments/grades (no `search` param) |
| 5.2 | Filtering | ✅ DONE | Exact-match filters per endpoint, only allow-listed names |
| 5.3 | Sorting (single column, allow-listed) | ✅ DONE | `sort` + `direction`; unknown values never sent |
| 5.4 | Pagination from the API's `meta` | ✅ DONE | `Pagination` renders `from`/`to`/`total`/`last_page`; `per_page ≤ 100` |
| 5.5 | Loading states | ✅ DONE | Skeletons/spinners; `DataState` |
| 5.6 | Empty states | ✅ DONE | `EmptyState` with a sensible next action |
| 5.7 | Form validation mirroring the Form Requests | ✅ DONE | `src/validation/validators.ts` + per-feature rules; `studentForm.test.tsx` |
| 5.8 | Server `422` mapped to the right field | ✅ DONE | `useFormState.applyServerErrors`; asserted in tests |
| 5.9 | `401 / 403 / 404 / 409 / 422 / 500` handling | ✅ DONE | `src/lib/errors.ts`; `dataStates.test.tsx` |
| 5.10 | Network / unreachable-API handling | ✅ DONE | "Cannot reach the API…" + retry; also handles proxy `502` with empty body |
| 5.11 | Success feedback using the API's own message | ✅ DONE | `ToastProvider` |
| 5.12 | Destructive-action confirmation, with `409` shown verbatim | ✅ DONE | `ConfirmDialog`; `e2e.test.tsx` |
| 5.13 | Prevent duplicate submission | 🟡 DONE (STUDENT FORM) | Guarded in `StudentFormPage` + disabled buttons elsewhere; see AI log "Bug 6" for the exact scope |

## 6. Testing

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 6.1 | Automated **authentication** tests | ✅ DONE | `src/auth/__tests__/authentication.test.tsx` (13 tests) |
| 6.2 | Automated **protected-route / authorization** tests | ✅ DONE | `roleAccess.test.tsx` (55) + `routing.test.tsx` (18) |
| 6.3 | An **API-integrated list** test | ✅ DONE | `studentList.test.tsx` (7) — asserts the query params actually sent |
| 6.4 | **Form validation / error** test | ✅ DONE | `studentForm.test.tsx` (9) |
| 6.5 | An **end-to-end** flow test | ✅ DONE | `e2e.test.tsx` (2) — sign in → search → open → delete (incl. a 409) → sign out |
| 6.6 | Full suite passes | ✅ DONE | `npm test` → **132 passed / 10 files** (re-run and confirmed) |
| 6.7 | Live API integration verification | ✅ DONE | `scripts/verify-api.ps1` — 129 assertions through the proxy (needs the stack running) |
| 6.8 | Backend test suite (dependency health) | ✅ DONE | `php artisan test` → 64 tests / 178 assertions (in `student-api/`) |
| 6.9 | Screenshots / evidence captured for submission | ⏳ EVIDENCE PENDING | Follow `TEST-EVIDENCE-CHECKLIST.md`; **not yet captured** |

## 7. UI quality and accessibility

| # | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 7.1 | Consistent design across screens | ✅ DONE | Shared primitives + `@theme` tokens in `src/index.css` |
| 7.2 | Responsive (desktop / tablet / mobile) | 🟡 DONE, VISUAL CAPTURE PENDING | Sidebar → drawer and tables → cards below `lg`; asserted by class contract (`layout.test.tsx`), **pixels need a real browser** |
| 7.3 | Accessible forms (labels, hints, `aria-invalid`, `role="alert"`) | ✅ DONE | `Field`/`Input` components |
| 7.4 | Keyboard support (skip link, focus ring, Escape closes dialogs/drawer) | ✅ DONE | `AppLayout`, `Modal`; `layout.test.tsx` |
| 7.5 | Semantic HTML landmarks and table semantics | ✅ DONE | Single `banner` landmark locked by a test |
| 7.6 | Status never conveyed by colour alone | ✅ DONE | Badges show a dot **and** the status text |
| 7.7 | No unnecessary dependencies added | ✅ DONE | Runtime deps are only React, React DOM, React Router, axios |

## 8. Repository hygiene and secrets

| # | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| 8.1 | No secrets committed | ✅ DONE | `.env` gitignored; `.env.example` holds placeholders only |
| 8.2 | Server-side validation documented | ✅ DONE | Mirrored in `src/validation`; the server remains authoritative |
| 8.3 | Frontend committed to the repository | ⏳ EVIDENCE PENDING | `student-web/` is present; confirm it is committed (`git log`/`git status`) in capture J7 |
| 8.4 | CI / container setup | ❌ NOT IMPLEMENTED | No CI or Docker files exist; not claimed |

## 9. Open items — what is not done

Listed plainly so nothing is overstated:

1. **Screenshots and terminal captures** (rows 6.9, 7.2, 8.3) — the app and tests exist; the images
   are still to be produced.
2. **Registration / password reset** (3.10, 3.11) — impossible against the current API.
3. **User / role management UI** (4.12) — impossible; there is no users endpoint.
4. **Search on enrollments and grades** (5.1) — the API exposes no `search` for those resources.
5. **Delete for grades** (4.7) — the API has no `DELETE /grades/{id}`.
6. **Dedicated statistics endpoint** (4.10) — dashboard figures are derived from `meta.total`.
7. **Instructor lookup** (4.13) — no users endpoint; seeded constants are used and labelled.
8. **"My profile" endpoint for students** (4.8) — a configured demo student id is used (W2).
9. **The Activity III requirements document itself** — not present in the repository; this checklist
   must be reconciled against it once available (anything it requires that is missing will be added
   here, not assumed).

## 10. Backend gaps that shape this checklist

These are the backend items identified in `../docs/BACKEND-VS-ACTIVITY-III.md`. Each is marked with
how the frontend handled it, and none required a backend change.

| # | Backend gap | Frontend handling |
| --- | --- | --- |
| C1 | No "my student profile" endpoint | `VITE_DEMO_STUDENT_ID` + an explanatory message (W2) |
| C2 | No users/instructors endpoint | Seeded-instructor constants, labelled (W1) |
| C3 | No registration endpoint | Not offered; the login screen says so |
| C4 | No password change/reset | Account page read-only |
| C5 | No student↔user link management | Not offered |
| C6 | No dashboard/statistics endpoints | Counts from `meta.total` |
| C7 | No attachments / audit / soft delete / bulk ops | Not offered |
