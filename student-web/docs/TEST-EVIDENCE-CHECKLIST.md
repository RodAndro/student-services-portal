# Test Evidence Checklist — Activity III

A capture list for the laboratory submission. Tick each item, save the screenshot/file under
`student-web/docs/evidence/` (suggested naming: `NN-short-name.png`), and reference it in the
compliance checklist.

> **These are captures to make — they are not yet in the repository.** Where a step needs the backend
> running, start MySQL and `php artisan serve` first, then `npm run dev` in `student-web`.
> **Do not screenshot anything containing a real password, token, `.env` value or personal data.**

---

## A. Environment and prerequisites

- [ ] **A1** — MySQL running, with a capture of `php artisan migrate:status` showing the tables.
- [ ] **A2** — Backend server up: terminal showing `php artisan serve` listening on
      `http://127.0.0.1:8000`.
- [ ] **A3** — `GET http://127.0.0.1:8000/api/v1/ping` returning `{"success": true, …}` (browser or
      Postman).
- [ ] **A4** — Backend API docs open at `http://127.0.0.1:8000/api/docs` (proves the contract the
      frontend targets).
- [ ] **A5** — Frontend dev server up: terminal showing Vite on `http://localhost:5173`.

## B. Terminal / build evidence (the "it really runs" proof)

- [ ] **B1** — `npm run typecheck` → no errors.
- [ ] **B2** — `npm run lint` (oxlint) → 0 warnings, 0 errors.
- [ ] **B3** — `npm run build` → success, `dist/` produced (capture the asset sizes).
- [ ] **B4** — `npm test` → **132 passed across 10 files** (capture the summary lines).
- [ ] **B5** — `scripts/verify-api.ps1` run with the stack up → **129 live assertions** against the
      real API (capture the final pass/fail count).
- [ ] **B6** — (`student-api`) `php artisan test` → **64 passed / 178 assertions** — shows the API
      the frontend depends on is itself healthy.

## C. Authentication flow

- [ ] **C1** — Login page at `/login` (shows "no self-registration" and the API base URL).
- [ ] **C2** — Empty-form submit blocked with field messages (client validation).
- [ ] **C3** — Invalid credentials (`admin@example.com` / wrong password) → the API's `422` message
      *"The provided credentials are incorrect."* shown on the form and under the email field.
- [ ] **C4** — Successful login as **admin** landing on the dashboard, with the user's name and role
      badge visible in the header.
- [ ] **C5** — Session restore: refresh the page while signed in and stay signed in (DevTools →
      Application → Local Storage showing the token key is enough, **mask the value**).
- [ ] **C6** — Sign out → returned to `/login`; capture DevTools Network showing
      `POST /api/v1/auth/logout` returning `200`, and that the stored token was cleared.

## D. Each module (list → detail → create → edit → delete)

For **each** of Programs, Courses, Academic Terms, Students, Course Offerings, Enrollments, Grades:

- [ ] **D1** — List screen with the **pagination** footer (`from`/`to`/`total`) visible.
- [ ] **D2** — A **search** applied, with DevTools Network showing the `search=` query parameter.
- [ ] **D3** — A **filter** and a **sort** applied, with the Network tab showing the exact parameter
      names (`program_id`, `status`, `sort`, `direction`, …).
- [ ] **D4** — The **create/edit form**, filled, with the **success toast using the API's message**.
- [ ] **D5** — A **`422`** shown against the correct field (e.g. duplicate `student_number`,
      duplicate program `code`, `final_grade` out of range).
- [ ] **D6** — The **delete confirmation dialog**.
- [ ] **D7** — A **`409` refusal** shown verbatim in the dialog (e.g. deleting a program that still
      has students, a course/term with offerings, a student with enrollments).

> Grades have **no delete** — capture the "a grade is corrected by editing" hint instead of a delete
> button. Enrollments and Grades have **no search** — capture the id/status filters instead.

## E. Authorization / roles (the security proof)

- [ ] **E1** — Sign in as **registrar** → same screens as admin; capture one write action succeeding.
- [ ] **E2** — Sign in as **instructor** → sidebar **without** Students; `/programs`, `/courses`,
      `/course-offerings`, `/enrollments`, `/grades` readable but **no** create/edit/delete buttons.
- [ ] **E3** — As instructor, the course-offerings list shows **only their own** rows (and the screen
      says the list is API-scoped).
- [ ] **E4** — As **student**, typing `http://localhost:5173/students` in the address bar →
      **403 page**.
- [ ] **E5** — As student, capture the **API** returning `403` for `GET /api/v1/students`
      (Postman or DevTools) — proving the boundary is the server, not the hidden link.
- [ ] **E6** — As student, reading **another** student's record by changing the id → `403`
      (object-level authorization).

## F. Error and edge-case handling

- [ ] **F1** — **401**: invalidate/remove the token (or call an endpoint with a bad token) →
      redirected to `/login` with the **"Your session has ended"** notice.
- [ ] **F2** — **403** page (covered in E4) and **404** page (visit `/this-does-not-exist`).
- [ ] **F3** — **Network error**: stop `php artisan serve`, then reload a list → **"Cannot reach the
      API…"** with a retry; restart the server and retry successfully.
- [ ] **F4** — **Empty state**: apply a filter/search that matches nothing → empty-state panel with
      the action to clear filters.
- [ ] **F5** — **Loading state**: capture a list mid-request (skeletons/spinner).
- [ ] **F6** — **Duplicate submission prevented**: show the submit button disabled/`aria-busy` while
      the request is in flight.

## G. Student portal and academic record

- [ ] **G1** — Student dashboard (own enrollments/grades counts + program).
- [ ] **G2** — `/portal` My Profile.
- [ ] **G3** — `/portal/enrollments` My Enrollments.
- [ ] **G4** — `/portal/grades` My Grades (with the server-computed remarks).
- [ ] **G5** — `/portal/academic-record` grouped **one card per academic term**, newest term first,
      with course / section / schedule / status / midterm / final / remarks.
- [ ] **G6** — The same academic-record view reached from the **staff** side
      (`Students → a student → Academic Record`), showing one component reused by both entry points.

## H. UI quality, responsiveness and accessibility

- [ ] **H1** — Desktop layout (`≥1024px`) with the permanent sidebar and a real table.
- [ ] **H2** — Tablet width (~768px).
- [ ] **H3** — Phone width (~375px): sidebar becomes a **drawer**, table rows become **cards**.
- [ ] **H4** — Keyboard focus visible on a control (Tab through the header/sidebar).
- [ ] **H5** — The **skip link** appearing on first Tab.
- [ ] **H6** — A **dialog** with focus moved in (and Escape closing it).
- [ ] **H7** — A **status badge** showing the dot **plus** the status text (never colour alone).

## I. API-contract evidence (how the frontend proves it uses the real API)

- [ ] **I1** — DevTools Network, filtered to `api/v1`, for one list request: show the **full URL**
      (`/api/v1/students?...`), the **method**, and the **`Authorization: Bearer …`** header
      (**mask the token value**).
- [ ] **I2** — A response body showing the real envelope `{ success, message, data, meta }`.
- [ ] **I3** — A `422` envelope with the `errors` object, matched to the highlighted field on screen.
- [ ] **I4** — A `409` envelope matched to the dialog message.

## J. Documentation and repository

- [ ] **J1** — `README.md` (setup, env, API base URL, commands, auth, roles, limitations).
- [ ] **J2** — `docs/API-INTEGRATION-MAP.md`.
- [ ] **J3** — `docs/AI-DEVELOPMENT-LOG.md`.
- [ ] **J4** — `docs/ARCHITECTURE.md`.
- [ ] **J5** — `docs/ACTIVITY-III-COMPLIANCE.md` (this activity's checklist).
- [ ] **J6** — `docs/LIMITATIONS.md`.
- [ ] **J7** — Git state: `git log --oneline` and `git status` showing the frontend committed (no
      `.env` or secrets staged).

---

## How to capture (quick reference)

| Evidence type | How |
| --- | --- |
| A screen | OS screenshot tool, or the browser's full-page capture, saved as `NN-name.png` |
| A terminal result | Select the text block and copy, or screenshot the terminal |
| A network request | DevTools → **Network** → the request → **Headers** and **Response** tabs |
| A stored token | DevTools → **Application** → **Local Storage** — show the key, **mask the value** |

**Non-negotiables for the submission:** no password shown, no real token value shown, no `.env`
contents shown, and no screenshot of data that is not seeded demo data.
