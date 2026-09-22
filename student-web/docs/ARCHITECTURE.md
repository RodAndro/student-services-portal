# Architecture Note — Activity III

How `student-web` is put together and how a single user action travels from the browser to MySQL and
back. Every layer below exists in the code; nothing is conceptual.

---

## 1. The layers at a glance

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (http://localhost:5173)                             │
│  React 19 SPA — pages, forms, tables, dialogs                │
└───────────────┬─────────────────────────────────────────────┘
                │  user interaction (click, type, submit)
                ▼
┌─────────────────────────────────────────────────────────────┐
│  React Frontend                                              │
│  • components / features  (presentation + interaction)       │
│  • hooks (useApiQuery, useListQueryState, useCount)          │
│  • auth (AuthProvider, RequireAuth, RequireRole)             │
└───────────────┬─────────────────────────────────────────────┘
                │  typed function call (e.g. studentsApi.listStudents)
                ▼
┌─────────────────────────────────────────────────────────────┐
│  API Service layer                                           │
│  • src/api/*.api.ts   one typed module per resource          │
│  • src/lib/http.ts    the single axios instance              │
│      – baseURL = /api/v1                                     │
│      – request interceptor: Authorization: Bearer <token>    │
│      – response interceptor: envelope check + 401 hook       │
│  • src/lib/errors.ts  one ApiError shape for every failure   │
│  • src/lib/query.ts   only allow-listed query parameters     │
└───────────────┬─────────────────────────────────────────────┘
                │  HTTP(S) + JSON   GET/POST/PUT/PATCH/DELETE
                │  (dev: Vite proxy /api/* → 127.0.0.1:8000)
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Laravel 12 REST API  (/api/v1)                              │
│  • routes → controllers (Api\V1\*)                           │
│  • auth:sanctum middleware → Sanctum opaque bearer tokens    │
│  • Policies → role + object-level authorization (403)        │
│  • Form Requests → validation (422)                          │
│  • API Resources → response shaping                          │
│  • ApiResponse → one { success, message, data, meta? } shape │
└───────────────┬─────────────────────────────────────────────┘
                │  Eloquent
                ▼
┌─────────────────────────────────────────────────────────────┐
│  MySQL database                                              │
│  8 domain tables + Sanctum tokens, seeded by factories       │
└─────────────────────────────────────────────────────────────┘
```

The backend is **frozen** for this activity: the frontend consumes it exactly as it is (see
[`LIMITATIONS.md`](LIMITATIONS.md)). It never opens a database connection and never talks to MySQL
directly.

---

## 2. Layer responsibilities

| Layer | Where | Responsibility |
| --- | --- | --- |
| Browser | — | Renders the SPA, stores the session token in `localStorage`, sends `XHR`/`fetch` via axios |
| React frontend | `src/features`, `src/components`, `src/hooks`, `src/auth` | Screens, forms, tables, dialogs, navigation, loading/empty/error states, URL-synced list state |
| API service | `src/api`, `src/lib` | Endpoint paths, query parameters, auth header, response unwrapping, error normalization |
| Laravel API | `../student-api` | Authentication, authorization, validation, persistence rules, response envelope |
| Database | MySQL | Tables, foreign keys, unique constraints (rebuilt from migrations + seeders) |

**Why the API service layer exists.** Components never call axios directly. A screen imports a typed
function (for example `studentsApi.listStudents({ search, page })`), and the only place `baseURL`,
the `Authorization` header, the envelope check and the 401 hook live is `src/lib/http.ts`. That keeps
30+ screens consistent and makes "which endpoint does this use?" answerable from one folder.

---

## 3. A request end to end (example: the Students list)

1. **Interaction.** The user opens `/students` and types a search term. `SearchInput` debounces the
   value (350 ms) and updates the URL through `useListQueryState` (search/sort/filter/page live in
   the query string, so refresh and Back/Forward work).
2. **Hook.** `useApiQuery` runs `studentsApi.listStudents(params)`, keyed on the parameters, so a
   change re-fetches and stale responses are discarded.
3. **API module.** `students.api.ts` builds the request and filters the parameters through
   `buildQuery(params, QUERY_KEYS)` — only the names `StudentController` accepts are ever sent.
4. **HTTP layer.** `http.ts` prefixes `/api/v1`, attaches `Authorization: Bearer <token>` from
   `localStorage`, and sends `GET /api/v1/students?search=…&page=1&per_page=15&sort=last_name`.
5. **Proxy (development).** The Vite dev server forwards `/api/*` to `http://127.0.0.1:8000`, so the
   browser treats the request as same-origin and CORS never applies.
6. **Backend.** Laravel authenticates the token (`auth:sanctum`), authorizes the ability through
   `StudentPolicy`, runs the query through `FiltersAndSorts`, and answers with the envelope:
   `{ success: true, message, data: [...], meta: { current_page, per_page, total, last_page, … } }`.
7. **Response.** The interceptor confirms the body is an API envelope, returns it, `unwrap()`/the
   caller reads `data` and `meta`, and `ResourceTable` + `Pagination` render rows and page controls.
8. **Failure path.** If the backend is down, the proxy returns `502` with an empty body; the
   interceptor rejects it as an `ApiError`, and `DataState`/`ErrorState` shows "Cannot reach the
   API…" with a retry action instead of rendering blank rows.

---

## 4. Authentication

- **Mechanism:** Laravel Sanctum **opaque bearer tokens** — not JWT, not cookies. The token is
  returned once by `POST /auth/login` and only its hash is stored on the server.
- **Flow:** the login form posts `{ email, password }`; on success `AuthProvider` stores the token
  and user in `localStorage` (`sim.token`, `sim.user`) and sets the status to `authenticated`. On a
  page load with a stored token, `AuthProvider` calls `GET /auth/me` to restore the session.
- **Every request** carries `Authorization: Bearer <token>` (request interceptor).
- **No expiry, no refresh.** `config/sanctum.php` sets `expiration => null`, so there is no
  silent-renew logic; a revoked token simply fails.
- **Sign-out** calls `POST /auth/logout`, which revokes **only** the token used for the request, then
  clears the local session.
- **Failures handled:** wrong credentials → `422` (shown under the email field), inactive account →
  `403`, missing/revoked token → `401` (handled centrally, see §7), network failure at bootstrap →
  the stored token is **kept** so a reload can retry.

There is **no registration and no password reset** — the login screen states that accounts are issued
by the administrator.

---

## 5. Authorization

Authorization is decided **on the server**, never in the browser. The frontend only *reflects* it.

- The backend has four roles (`admin`, `registrar`, `instructor`, `student`) enforced by **Laravel
  Policies**. `admin` and `registrar` are "staff" and bypass every check; the other roles are checked
  per ability, including **object-level** rules (a student may read only their own record; an
  instructor only their own offerings).
- The frontend mirrors the policy matrix in **one place** — `src/components/layout/navigation.ts`
  (`NAV_ITEMS`, `navItemsForRole`, and the `ALL_ROLES` / `ALL_STAFF` / `STAFF_AND_INSTRUCTOR` lists).
  The layout filters the sidebar with it, and `router.tsx` uses the same lists for `RequireRole`.
- Therefore a hidden link is also a **refused direct visit**: typing a forbidden URL renders the
  **403 page**, and the underlying API request would return `403` regardless.
- Where a role cannot act, the action is simply not rendered (no create/edit/delete buttons for an
  instructor), but this is cosmetic — the API is the boundary, verified with live `403` responses.

---

## 6. State management

There is **no global state library**. State is kept where it belongs:

| Kind of state | Where it lives | Notes |
| --- | --- | --- |
| Session (token + user) | `AuthContext` / `AuthProvider` | the only truly global state; also persisted in `localStorage` |
| List state (search, filters, sort, page) | **the URL** via `useListQueryState` | refresh-safe, shareable, Back/Forward work; changing a filter resets to page 1 |
| Fetched data (loading / data / error / refetch) | `useApiQuery` per screen | minimal fetch hook, keyed to its parameters |
| Counts on the dashboard | `useCount` | reads `meta.total` from a `per_page=1` collection request |
| Form values and errors | `useFormState` | also merges a server `422` into the right fields |
| Toasts | `ToastContext` (`ToastProvider`) | transient success/error feedback |
| UI toggles (drawer, dialogs) | local `useState` | never global |

List state deliberately lives in the URL rather than in React state, so the view survives a refresh
and can be linked. The nested tab routes (`/students/:id/grades`) keep their page number in local
state, because the nested endpoints accept only `page`/`per_page`.

---

## 7. Error handling

Every failure — axios or not — is normalized into a single shape by `src/lib/errors.ts`:

```ts
interface ApiError { status: number; message: string; fieldErrors?: Record<string, string[]> }
```

Two rules make the messages trustworthy: the API's own `message` always wins over a generic one, and
a **success** response whose body is not the `{ success, … }` envelope is rejected as an error rather
than handed to a screen (so a proxy page or a wrong base URL cannot render `undefined` fields).

| Status | Cause | Frontend behaviour |
| --- | --- | --- |
| `401` | missing / invalid / revoked token | a single central hook clears the session once and returns to `/login` with "Your session has ended" |
| `403` | authenticated but not allowed | the **403 page** for a guarded route; an inline message for an action; instructor lists render read-only |
| `404` | unknown id, or unknown URL | the 404 page (unknown URL) or a "not found" panel with no retry |
| `409` | duplicate enrollment, capacity reached, delete blocked by dependents | the API's message is shown **verbatim** — inside the delete dialog for a blocked delete |
| `422` | validation failure | `fieldErrors` are merged under the matching inputs; the form stays open |
| `500` | unexpected server error | the 500 page with a retry link |
| `502/503/504` or status `0` | backend unreachable (through the proxy or directly) | "Cannot reach the API. Make sure the Laravel server is running…" with a retry action |

Render-time bugs are caught by `ErrorBoundary` (→ `ServerErrorPage`). Every data screen routes its
loading / empty / error / content branches through `DataState`.

---

## 8. Role-aware UI

The same route table serves all four roles; what changes is which branches are reachable and which
controls are shown.

| Role | Sidebar | Landing page |
| --- | --- | --- |
| Administrator | Dashboard · Programs · Courses · Academic Terms · Students · Course Offerings · Enrollments · Grades · My Account | staff dashboard (all counts + recent enrollments) |
| Registrar | identical to the administrator (both are staff) | staff dashboard |
| Instructor | Dashboard · Programs · Courses · Academic Terms · Course Offerings · Enrollments · Grades · My Account (no Students) | instructor dashboard (own offerings/enrollments/grades only) |
| Student | Dashboard · My Profile · My Enrollments · My Grades · My Academic Record · My Account | student dashboard (own counts + program) |

The dashboard is three components chosen by role, so a student never fires a request it knows will be
`403` (for example `GET /students`). The account page is available to every role because it only
reads `GET /auth/me`, and it is read-only because the API offers no profile update.

---

## 9. Source map

| Concern | Files |
| --- | --- |
| Config / base URL | `src/config/env.ts`, `src/config/backend-limitations.ts` |
| HTTP + errors + query | `src/lib/http.ts`, `src/lib/errors.ts`, `src/lib/query.ts`, `src/lib/storage.ts` |
| Typed endpoints | `src/api/*.api.ts`, `src/api/unwrap.ts` |
| Session / guards | `src/auth/*`, `src/features/auth/LoginPage.tsx` |
| Routing | `src/router.tsx`, `src/components/layout/navigation.ts` |
| Screens | `src/features/{programs,courses,academic-terms,students,course-offerings,enrollments,grades,dashboard,account,portal}/` |
| Shared UI | `src/components/{ui,data,layout,feedback,forms}/` |
| Tests | `src/**/__tests__/*`, `src/test/*`, `scripts/verify-api.ps1` |
| Dev proxy | `vite.config.ts` |
