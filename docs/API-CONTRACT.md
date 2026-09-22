# ACTIVITY I — BACKEND API CONTRACT

This contract describes **your actual backend**, not a generic example. It was produced by reading
the Laravel project in `student-api/` (commit `0f93d8a`).

**Sources inspected:** `routes/api.php`, `app/Http/Controllers/Api/V1/*`, `app/Http/Requests/*`,
`app/Http/Resources/*`, `app/Models/*`, `app/Policies/*`, `app/Traits/FiltersAndSorts.php`,
`app/Support/ApiResponse.php`, `app/Http/Middleware/ForceJsonResponse.php`, `bootstrap/app.php`,
`config/sanctum.php`, `config/cors.php`, `database/migrations/*`,
`database/seeders/DatabaseSeeder.php`, `tests/Feature/*`, `postman/*`, `docs/*`.

> If any of this disagrees with my reading, the code wins — say which part and I will re-check.

---

## 1. Base API URL

| Environment | Base URL |
| --- | --- |
| Local development (`php artisan serve`) | `http://127.0.0.1:8000/api/v1` |
| API docs (Swagger UI) | `http://127.0.0.1:8000/api/docs` |
| OpenAPI JSON | `http://127.0.0.1:8000/api/docs.json` |

- Every endpoint is versioned: the full path is `/api/v1/...`.
- All responses are JSON. A middleware (`ForceJsonResponse`) forces `Accept: application/json` on
  every `/api/*` request, so errors are never returned as HTML.
- Health check: `GET /api/v1/ping` (public, no token).

---

## 2. Authentication

### How it works

- **Laravel Sanctum personal access tokens** (opaque bearer tokens), not JWT.
- Log in → the server returns a **plaintext token once** (`1|xxxxxxxx...`). Only its SHA-256 hash is
  stored in `personal_access_tokens`.
- Send it on every protected request: `Authorization: Bearer <token>`.
- **There is no self-registration endpoint.** Accounts are created by the database seeder.
- **Tokens do not expire** (`config/sanctum.php` → `expiration => null`). There is **no refresh
  token** and no password-change/reset endpoint.
- `POST /auth/logout` deletes **only the token used for that request**. Other tokens stay valid.

### Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Log in, receive token |
| POST | `/auth/logout` | Bearer | Revoke the current token |
| GET | `/auth/me` | Bearer | Current authenticated user |

### `POST /auth/login`

Request:

```json
{ "email": "admin@example.com", "password": "password" }
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | yes | must be a valid email |
| `password` | string | yes | — |

Success — `200`:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "3|XyZ...",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "System Administrator",
      "email": "admin@example.com",
      "email_verified_at": "2026-09-21T10:00:00+08:00",
      "role": "admin",
      "status": "ACTIVE",
      "created_at": "2026-09-21T10:00:00+08:00",
      "updated_at": "2026-09-21T10:00:00+08:00"
    }
  }
}
```

> **Important shape difference:** `login` and `/auth/me` return the **raw user model**
> (`id, name, email, email_verified_at, role, status, created_at, updated_at`), while nested
> `instructor` objects inside course offerings return a **`UserResource`**
> (`id, name, email, role, status` — no timestamps). Do not assume one shape everywhere.
> `password` and `remember_token` are always hidden.

Failures:

| Case | Status | Body |
| --- | --- | --- |
| Wrong password **or** unknown email | `422` | `{"success": false, "message": "The provided credentials are incorrect.", "errors": {"email": ["The provided credentials are incorrect."]}}` |
| Account `status != ACTIVE` | `403` | `{"success": false, "message": "This account is inactive."}` |
| Missing required fields | `422` | standard validation envelope |

### `POST /auth/logout`

Bearer required. `200` → `{"success": true, "message": "Logout successful.", "data": null}`.

### `GET /auth/me`

Bearer required. `200` → `{"success": true, "message": "Authenticated user retrieved.", "data": { ...user model... }}`.

### Authentication header

```http
Authorization: Bearer 3|XyZ...
Accept: application/json
Content-Type: application/json   (only when sending a body)
```

---

## 3. Users and Roles

- **There is no `/users` endpoint.** No list, create, update, or delete for user accounts.
- Roles are a **string column** (`users.role`), not a roles table. The four values are:
  `admin`, `registrar`, `instructor`, `student`.
- `users.status` is `ACTIVE` or `INACTIVE`.
- The only way to create users is `database/seeders/DatabaseSeeder.php` (or `php artisan tinker`).

Seeded development accounts (all password `password`):

| Role | Email |
| --- | --- |
| Administrator | `admin@example.com` |
| Registrar | `registrar@example.com` |
| Instructor | `instructor@example.com` |
| Instructor | `instructor2@example.com` |
| Instructor | `instructor3@example.com` |
| Student | `student@example.com` |

The `student@example.com` account is linked to **student profile #1** (that is what makes
object-level authorization demonstrable).

---

## 4. Roles and Permissions (actual, from the Policies)

A `before()` method grants `admin` and `registrar` full access to everything ("staff"). Everyone
else is checked by the rule shown.

| Resource | admin | registrar | instructor | student |
| --- | --- | --- | --- | --- |
| Programs | full CRUD + list | full CRUD + list | list + read | ❌ 403 |
| Courses | full CRUD + list | full CRUD + list | list + read | ❌ 403 |
| Academic Terms | full CRUD + list | full CRUD + list | list + read | ❌ 403 |
| Course Offerings | full CRUD + list | full CRUD + list | list (own only) + read own | ❌ 403 |
| Students | full CRUD + list | full CRUD + list | ❌ 403 | read **own only** |
| Enrollments | full + list | full + list | list (own offerings) + read own | read **own only** |
| Grades | full + list | full + list | list (own offerings) + read/update own | read **own only** |
| Academic Record | any student | any student | ❌ 403 | **own only** |

Consequences for the frontend:

- A **student login cannot call** `/programs`, `/courses`, `/academic-terms`, `/course-offerings`,
  `/students`, `/enrollments` or `/grades` **list** endpoints — they all return `403`.
  A student UI must use only `/auth/me`, `/students/{own-id}`, `/students/{own-id}/enrollments`,
  `/students/{own-id}/grades`, `/students/{own-id}/academic-record`.
- **The student's own student-profile id is not returned by the API directly.** `/auth/me` gives the
  *user* id, not the linked `students.id`. The API exposes no "my profile" endpoint. See §11.

---

## 5. Common Conventions

### Success envelope

```json
{ "success": true, "message": "Students retrieved successfully.", "data": ... }
```

For **collection** endpoints, a `meta` object is added:

```json
{
  "success": true,
  "message": "Students retrieved successfully.",
  "data": [ ... ],
  "meta": {
    "current_page": 1, "per_page": 15, "total": 103,
    "last_page": 7, "from": 1, "to": 15
  }
}
```

### Error envelope

```json
{ "success": false, "message": "..." }                                  // no field errors
{ "success": false, "message": "Validation failed.", "errors": { ... } } // 422 only
```

`errors` is an object of `field -> array of messages`.

### Pagination

- Query params: `page` (default 1) and `per_page` (default **15**, clamped to **1–100**).
- `per_page=500` silently becomes `100`. Collections are never returned in full.

### Search

- One parameter: `search`, doing a **partial (LIKE %value%)** match across a per-resource list of
  text fields. There is **no field-specific search** (e.g. no `?last_name=`).

### Filtering

- **Exact-match** filters only, one per listed column. **No ranges, no date filters, no
  "in" filters.**

### Sorting

- `sort` (column, validated against an allow-list) + `direction` (`asc` | `desc`).
- An **unknown `sort` value silently falls back** to the resource's default sort — it is not an
  error and cannot inject SQL.
- **Single-column sorting only.**

### Per-resource query parameters

| Endpoint | Searchable fields (`search`) | Exact filters | Sortable fields | Default sort |
| --- | --- | --- | --- | --- |
| `students` | first_name, middle_name, last_name, student_number, email | `program_id`, `year_level`, `status` | last_name, first_name, student_number, year_level, created_at, id | `last_name asc` |
| `programs` | code, name | `status` | code, name, created_at, id | `name asc` |
| `courses` | course_code, course_title | `status` | course_code, course_title, units, created_at, id | `course_title asc` |
| `academic-terms` | academic_year | `semester`, `status` | academic_year, semester, start_date, id | `academic_year desc` |
| `course-offerings` | section, schedule, room | `course_id`, `academic_term_id`, `instructor_id`, `status` | section, capacity, created_at, id | `id asc` |
| `enrollments` | *(none)* | `student_id`, `course_offering_id`, `status` | enrollment_date, status, id | `id desc` |
| `grades` | *(none)* | `enrollment_id` | midterm_grade, final_grade, created_at, id | `id desc` |

Nested list endpoints (`/students/{id}/enrollments`, `/students/{id}/grades`,
`/course-offerings/{id}/students`) accept **only** `page` and `per_page` — no search/sort/filter.

---

## 6. Endpoint Reference

### 6.2 Programs

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/programs` | Bearer | admin, registrar, instructor |
| POST | `/programs` | Bearer | admin, registrar |
| GET | `/programs/{program}` | Bearer | admin, registrar, instructor |
| PUT/PATCH | `/programs/{program}` | Bearer | admin, registrar |
| DELETE | `/programs/{program}` | Bearer | admin, registrar |

Create body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `code` | string | yes | max 20, **unique** |
| `name` | string | yes | max 255 |
| `description` | string\|null | no | — |
| `status` | string | yes | `ACTIVE` \| `INACTIVE` |

`ProgramResource`: `id, code, name, description, status, created_at, updated_at`

Delete returns `409` if students are assigned: `"Cannot delete this program because students are assigned to it."`

### 6.3 Students

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/students` | Bearer | admin, registrar |
| POST | `/students` | Bearer | admin, registrar |
| GET | `/students/{student}` | Bearer | admin, registrar, **owning student** |
| PUT/PATCH | `/students/{student}` | Bearer | admin, registrar |
| DELETE | `/students/{student}` | Bearer | admin, registrar |
| GET | `/students/{student}/enrollments` | Bearer | admin, registrar, owning student |
| GET | `/students/{student}/grades` | Bearer | admin, registrar, owning student |
| GET | `/students/{student}/academic-record` | Bearer | admin, registrar, owning student |

Create/update body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `student_number` | string | yes (create) | max 50, **unique** |
| `first_name` | string | yes (create) | max 100 |
| `middle_name` | string\|null | no | max 100 |
| `last_name` | string | yes (create) | max 100 |
| `suffix` | string\|null | no | max 20 |
| `birth_date` | date `Y-m-d` | no | must be before today |
| `email` | string\|null | no | valid email, max 255 (**not unique**) |
| `contact_number` | string\|null | no | max 50 |
| `address` | string\|null | no | — |
| `program_id` | integer | yes (create) | must exist in `programs` |
| `year_level` | integer | yes (create) | `1`–`4` |
| `status` | string | yes (create) | `ACTIVE` \| `INACTIVE` |

> On update, all fields are `sometimes` (partial update allowed).
> `user_id` is **not** accepted — it cannot be set through the API.

`StudentResource`: `id, student_number, first_name, middle_name, last_name, suffix, full_name,
birth_date, email, contact_number, address, program_id, program{...ProgramResource}, year_level,
status, created_at, updated_at`

Delete returns `409` if the student has enrollments:
`"Cannot delete this student because they have enrollments."`

### 6.4 Courses

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/courses` | Bearer | admin, registrar, instructor |
| POST | `/courses` | Bearer | admin, registrar |
| GET | `/courses/{course}` | Bearer | admin, registrar, instructor |
| PUT/PATCH | `/courses/{course}` | Bearer | admin, registrar |
| DELETE | `/courses/{course}` | Bearer | admin, registrar |

Create body: `course_code` (required, max 20, unique), `course_title` (required, max 255),
`description` (nullable), `units` (required, integer 1–12), `status` (required, `ACTIVE|INACTIVE`).

`CourseResource`: `id, course_code, course_title, description, units, status, created_at, updated_at`

Delete returns `409` if it has offerings.

### 6.5 Academic Terms

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/academic-terms` | Bearer | admin, registrar, instructor |
| POST | `/academic-terms` | Bearer | admin, registrar |
| GET | `/academic-terms/{academic_term}` | Bearer | admin, registrar, instructor |
| PUT/PATCH | `/academic-terms/{academic_term}` | Bearer | admin, registrar |
| DELETE | `/academic-terms/{academic_term}` | Bearer | admin, registrar |

Create body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `academic_year` | string | yes | max 20; **unique together with `semester`** |
| `semester` | integer | yes | `1` \| `2` \| `3` |
| `start_date` | date | yes | — |
| `end_date` | date | yes | must be **after** `start_date` |
| `status` | string | yes | `ACTIVE` \| `UPCOMING` \| `INACTIVE` |

> A duplicate `academic_year` + `semester` pair returns `422` on the `academic_year` field.

`AcademicTermResource`: `id, academic_year, semester, start_date, end_date, status, created_at, updated_at`

Delete returns `409` if it has course offerings.

### 6.6 Course Offerings

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/course-offerings` | Bearer | admin, registrar (all) · instructor (**own only**) |
| POST | `/course-offerings` | Bearer | admin, registrar |
| GET | `/course-offerings/{course_offering}` | Bearer | admin, registrar, owning instructor |
| PUT/PATCH | `/course-offerings/{course_offering}` | Bearer | admin, registrar |
| DELETE | `/course-offerings/{course_offering}` | Bearer | admin, registrar |
| GET | `/course-offerings/{course_offering}/students` | Bearer | admin, registrar, owning instructor |

Create body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `course_id` | integer | yes | must exist |
| `academic_term_id` | integer | yes | must exist |
| `instructor_id` | integer | yes | must exist **and** have `role = instructor` |
| `section` | string | yes | max 20 |
| `schedule` | string | yes | max 100 |
| `room` | string\|null | no | max 50 |
| `capacity` | integer | yes | `1`–`500` |
| `status` | string | yes | `ACTIVE` \| `INACTIVE` |

`CourseOfferingResource`: `id, course_id, course{...}, academic_term_id, academic_term{...},
instructor_id, instructor{id,name,email,role,status}, section, schedule, room, capacity,
enrollments_count, status, created_at, updated_at`

> When an **instructor** calls the list endpoint, the server automatically adds
> `where instructor_id = <their id>` and returns `meta.total` for their own offerings only.
> There is **no `GET /users`**, so the frontend cannot populate an instructor dropdown from the
> API (see §11).

Delete returns `409` if it has enrollments.

### 6.7 Enrollments

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/enrollments` | Bearer | admin, registrar (all) · instructor (own offerings) |
| POST | `/enrollments` | Bearer | admin, registrar |
| GET | `/enrollments/{enrollment}` | Bearer | admin, registrar, owning instructor, owning student |
| PATCH | `/enrollments/{enrollment}` | Bearer | admin, registrar |
| DELETE | `/enrollments/{enrollment}` | Bearer | admin, registrar |

Create body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `student_id` | integer | yes | must exist |
| `course_offering_id` | integer | yes | must exist |
| `enrollment_date` | date | no | defaults to today |
| `status` | string | no | `ENROLLED` \| `DROPPED` \| `COMPLETED`; defaults to `ENROLLED` |

`EnrollmentResource`: `id, student_id, student{...StudentResource}, course_offering_id,
course_offering{...CourseOfferingResource}, enrollment_date, status, grade{...}|null, created_at,
updated_at`

`409` cases: already enrolled (`"The student is already enrolled in this course offering."`),
or offering at capacity (`"This course offering has reached its capacity."`).

> There is **no** `POST /students/{id}/enrollments` or `POST /course-offerings/{id}/enrollments`.
> The frontend must send `student_id` + `course_offering_id` in the body of `POST /enrollments`.

### 6.8 Grades

| Method | Path | Auth | Roles |
| --- | --- | --- | --- |
| GET | `/grades` | Bearer | admin, registrar (all) · instructor (own offerings) |
| POST | `/grades` | Bearer | admin, registrar, **owning instructor** |
| GET | `/grades/{grade}` | Bearer | admin, registrar, owning instructor, owning student |
| PUT/PATCH | `/grades/{grade}` | Bearer | admin, registrar, owning instructor |

> **There is no `DELETE /grades/{id}`.** Grades are corrected by updating them.

Create body:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `enrollment_id` | integer | yes | must exist, and must not already have a grade |
| `midterm_grade` | number\|null | no | `0`–`100` |
| `final_grade` | number\|null | no | `0`–`100` |

Update body: `midterm_grade`, `final_grade` (both `sometimes`, nullable, 0–100).

`GradeResource`: `id, enrollment_id, midterm_grade, final_grade, remarks,
enrollment{...EnrollmentResource}, created_at, updated_at`

`remarks` is **computed by the server**, never sent by the client:
`final_grade` absent → `IN PROGRESS`; `>= 75` → `PASSED`; `< 75` → `FAILED`.

`409` if the enrollment already has a grade: `"A grade already exists for this enrollment."`

### 6.9 Academic Record

`GET /students/{student}/academic-record` — no query parameters, **not paginated**.

```json
{
  "success": true,
  "message": "Academic record retrieved successfully.",
  "data": {
    "student": { ...StudentResource... },
    "academic_record": [
      {
        "academic_term": { ...AcademicTermResource... },
        "enrollments": [
          {
            "enrollment_id": 201,
            "course": { ...CourseResource... },
            "section": "A-1",
            "schedule": "MWF 08:00",
            "status": "ENROLLED",
            "grade": { "midterm_grade": 88, "final_grade": 90, "remarks": "PASSED" }
          }
        ]
      }
    ]
  }
}
```

- The array is **grouped by academic term** and sorted by term (newest first).
- `grade` is `null` when the enrollment has no grade yet.
- Note the grade here is a **trimmed object** (`midterm_grade`, `final_grade`, `remarks`) — not the
  full `GradeResource` used elsewhere.

---

## 7. HTTP Status Codes Actually Returned

| Status | When | Body shape |
| --- | --- | --- |
| `200` | GET, PUT/PATCH, DELETE, login, logout | success envelope |
| `201` | POST create | success envelope |
| `401` | Missing / invalid / revoked token | `{"success": false, "message": "Unauthenticated."}` |
| `403` | Authenticated but not allowed; inactive account | `{"success": false, "message": "This action is unauthorized."}` or `"This account is inactive."` |
| `404` | Unknown id, or route not found | `{"success": false, "message": "Not found."}` |
| `405` | Wrong HTTP verb for a path | `{"success": false, "message": "Method not allowed."}` |
| `409` | Duplicate enrollment, capacity reached, duplicate grade, dependent records | `{"success": false, "message": "<specific message>"}` |
| `422` | Validation failure, wrong credentials | `{"success": false, "message": "Validation failed.", "errors": {...}}` |
| `500` | Unexpected server error | `{"success": false, "message": "Server error."}` |

**The API never returns HTML to `/api/*`, and never leaks stack traces, SQL, passwords, or
tokens.** `204` is **not used** (deletes return `200` with a message and `data: null`).

---

## 8. Field Types and Formats

| Kind | Format |
| --- | --- |
| Ids / counts | integers |
| Dates (`birth_date`, `start_date`, `end_date`, `enrollment_date`) | `"YYYY-MM-DD"` |
| Timestamps (`created_at`, `updated_at`, `email_verified_at`) | ISO-8601 string, e.g. `"2026-09-21T11:20:00+08:00"` |
| Grades | JSON number (`decimal(5,2)`) |
| Money | *not applicable — this API has no money fields* |
| `data` on delete/logout | `null` |
| Booleans | `success` only |

**Nullable fields:** `middle_name`, `suffix`, `birth_date`, `email`, `contact_number`, `address`,
`room`, `description`, `midterm_grade`, `final_grade`, `grade` (nested), and `data` on
delete/logout.

---

## 9. Nested Relation Caveats (important for rendering)

Resources use `whenLoaded`, so a nested object appears **only if the controller eager-loaded it**.
Practically:

| Response | Always present | Sometimes absent |
| --- | --- | --- |
| `StudentResource` | `program` | — |
| `CourseOfferingResource` (via `/course-offerings`) | `course`, `academic_term`, `instructor`, `enrollments_count` | — |
| `EnrollmentResource` (via `/enrollments`) | `student`, `course_offering` (with `course`, `academic_term`, `grade`) | `course_offering.instructor` |
| `EnrollmentResource` (via `/students/{id}/enrollments`) | `course_offering` (with `course`, `academic_term`), `grade` | `student`, `course_offering.instructor` |
| `GradeResource` (via `/grades`) | `enrollment` (with `student`, `course_offering.course`) | `enrollment.course_offering.academic_term`, `...instructor` |

**Rule for the frontend: never assume a nested object exists — check before rendering.** Keys that
were not loaded are simply omitted (not `null`).

---

## 10. Integration Gotchas (verified)

1. **CORS.** `config/cors.php` allows only the origins in `CORS_ALLOWED_ORIGINS` (default
   `http://localhost`). A frontend dev server on another port (e.g. `http://localhost:5173`) will be
   **blocked by the browser** until that origin is added to `.env` → `CORS_ALLOWED_ORIGINS=http://localhost:5173`.
   Postman/curl are unaffected.
2. **No user management API.** No list/create/update/delete for users, no role assignment.
3. **No instructor lookup.** The course-offering form needs an `instructor_id`, but there is no
   endpoint that lists users. Today the frontend cannot build that dropdown from the API.
4. **No student↔user link management.** `students.user_id` exists but cannot be set via the API.
5. **No registration, no password reset.**
6. **Tokens never expire.** Logout is the only way to revoke.
7. **Grades are not deletable.**
8. **Deletes are permanent** (no soft delete / restore).
9. **No dashboard/aggregate endpoints** (no counts, no statistics) — a dashboard must be computed
   client-side from list responses (and those lists are paginated).
10. `meta.total` on a paginated response is the only cheap way to get a count.

---

## 11. Quick Endpoint Index (all 42 routes)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /api/v1/ping

GET    /api/v1/programs              POST   /api/v1/programs
GET    /api/v1/programs/{id}         PUT|PATCH /api/v1/programs/{id}    DELETE /api/v1/programs/{id}

GET    /api/v1/students              POST   /api/v1/students
GET    /api/v1/students/{id}         PUT|PATCH /api/v1/students/{id}    DELETE /api/v1/students/{id}
GET    /api/v1/students/{id}/enrollments
GET    /api/v1/students/{id}/grades
GET    /api/v1/students/{id}/academic-record

GET    /api/v1/courses               POST   /api/v1/courses
GET    /api/v1/courses/{id}          PUT|PATCH /api/v1/courses/{id}     DELETE /api/v1/courses/{id}

GET    /api/v1/academic-terms        POST   /api/v1/academic-terms
GET    /api/v1/academic-terms/{id}   PUT|PATCH /api/v1/academic-terms/{id}  DELETE /api/v1/academic-terms/{id}

GET    /api/v1/course-offerings      POST   /api/v1/course-offerings
GET    /api/v1/course-offerings/{id} PUT|PATCH /api/v1/course-offerings/{id} DELETE /api/v1/course-offerings/{id}
GET    /api/v1/course-offerings/{id}/students

GET    /api/v1/enrollments           POST   /api/v1/enrollments
GET    /api/v1/enrollments/{id}      PATCH  /api/v1/enrollments/{id}    DELETE /api/v1/enrollments/{id}

GET    /api/v1/grades                POST   /api/v1/grades
GET    /api/v1/grades/{id}           PUT|PATCH /api/v1/grades/{id}      (no DELETE)
```
