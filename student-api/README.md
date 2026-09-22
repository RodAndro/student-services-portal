# Student Information Management API

A backend-only **REST API** for managing student records, academic programs, courses,
academic terms, course offerings, enrollments, and grades.

The API is built with **Laravel 12** and **Laravel Sanctum**, exposes every endpoint under
**`/api/v1`**, enforces authentication and authorization on the server, validates all input,
and returns a consistent JSON response envelope.

There is **no graphical frontend** — this project is the API only.

---

## Project Documentation

| Document | Purpose |
| --- | --- |
| [`README.md`](README.md) | Setup, usage, and API reference (this file) |
| [`docs/ERD.md`](docs/ERD.md) | Entity-relationship diagram, constraints, and data rules |
| [`docs/demo-script.md`](docs/demo-script.md) | The 25-step final demonstration walkthrough |
| [`docs/compliance-checklist.md`](docs/compliance-checklist.md) | Laboratory requirement checklist |
| [`postman/`](postman/) | Postman collection + environment |

Live API documentation: `http://127.0.0.1:8000/api/docs`

---

## Table of Contents

1. [Project Description](#project-description)
2. [Technology Stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Migration Instructions](#migration-instructions)
8. [Seeder Instructions](#seeder-instructions)
9. [How to Start the API](#how-to-start-the-api)
10. [Authentication Instructions](#authentication-instructions)
11. [API Documentation Location](#api-documentation-location)
12. [How to Run Tests](#how-to-run-tests)
13. [Development Test Accounts](#development-test-accounts)
14. [API Overview](#api-overview)
15. [Search, Filtering, Sorting and Pagination](#search-filtering-sorting-and-pagination)
16. [Response Format and Status Codes](#response-format-and-status-codes)
17. [Authorization Model](#authorization-model)
18. [Database and ERD](#database-and-erd)
19. [Postman Collection](#postman-collection)
20. [Security Notes](#security-notes)
21. [AI Tools Used](#ai-tools-used)
22. [How AI-Generated Code Was Reviewed and Verified](#how-ai-generated-code-was-reviewed-and-verified)

---

## Project Description

The Student Information Management API models a small college registrar system. It supports:

- **Authentication** with Laravel Sanctum (login, logout, current user).
- **Master data**: programs, students, courses, academic terms.
- **Academic transactions**: course offerings, enrollments, grades.
- **Academic records**: a student's grades grouped by academic term.
- **Role-based and object-level authorization**: a student can only read their own data, and an
  instructor can only read/grade their own course offerings.
- **Consistent collection features**: search, filtering, sorting, and pagination on every list
  endpoint, with a predictable response envelope.

## Technology Stack

| Layer | Choice |
| --- | --- |
| Framework | Laravel 12 (PHP 8.2+) |
| Database | MySQL (MariaDB/MySQL 8) |
| ORM | Laravel Eloquent |
| Authentication | Laravel Sanctum (opaque API tokens) |
| API format | JSON, versioned under `/api/v1` |
| Validation | Laravel Form Requests |
| Authorization | Laravel Policies |
| API documentation | Scramble (OpenAPI 3.1 + Swagger-style UI) |
| Testing | PHPUnit (Laravel's `php artisan test`) |
| Version control | Git / GitHub |

## Prerequisites

- **PHP 8.2 or later** with the `pdo_mysql`, `mbstring`, and `openssl` extensions
- **Composer 2**
- **MySQL 8** (or MariaDB) running locally
- **Git**

Verify your tools:

```bash
php -v
composer --version
mysql --version
```

## Installation

1. Clone the repository and open the project folder:

   ```bash
   git clone <repository-url>
   cd student-api
   ```

2. Install PHP dependencies:

   ```bash
   composer install
   ```

3. Create your environment file and generate the application key:

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

(The exact `.env` values are covered in the next sections.)

## Environment Configuration

All configuration lives in the `.env` file. **`.env` is gitignored and is never committed** —
only the safe `.env.example` template is committed. The values you normally need to set for
this project are:

```dotenv
APP_NAME="Student Information Management API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=student_api
DB_USERNAME=root
DB_PASSWORD=
```

> Use your own local MySQL username and password. Do not commit real credentials.

## Database Setup

Create an empty database before running migrations:

```bash
mysql -u root -p -e "CREATE DATABASE student_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Then confirm Laravel can reach it:

```bash
php artisan migrate:status
```

## Migration Instructions

The database schema is **fully reproducible from migrations** (the source of truth for the
schema). To build it:

```bash
php artisan migrate
```

To rebuild from scratch (drops all tables, then re-runs every migration):

```bash
php artisan migrate:fresh
```

The migrations create these tables: `users`, `programs`, `students`, `courses`,
`academic_terms`, `course_offerings`, `enrollments`, `grades`, plus Laravel's supporting tables
(`personal_access_tokens`, `cache`, `jobs`, `sessions`, etc.).

## Seeder Instructions

Factories and seeders generate realistic sample data (no hand-typed records). To migrate and
seed in one step:

```bash
php artisan migrate:fresh --seed
```

Or seed an already-migrated database:

```bash
php artisan db:seed
```

The seeder generates at least:

| Entity | Minimum |
| --- | ---: |
| Users | 6 |
| Programs | 3 |
| Students | 100 |
| Courses | 20 |
| Academic Terms | 2 |
| Course Offerings | 20 |
| Enrollments | 200 |
| Grades | 100 |

It also creates one demo account per role (see
[Development Test Accounts](#development-test-accounts)).

## How to Start the API

Run the built-in development server:

```bash
php artisan serve
```

The API is then available at:

```
http://127.0.0.1:8000/api/v1
```

Quick smoke test:

```bash
curl http://127.0.0.1:8000/api/v1/ping
```

```json
{
  "success": true,
  "message": "API is running.",
  "data": {
    "service": "Student Information Management API",
    "version": "v1",
    "time": "2026-09-21T12:00:00+08:00"
  }
}
```

## Authentication Instructions

Authentication uses **Laravel Sanctum**. Passwords are hashed with bcrypt and are never
returned by any endpoint.

1. **Log in** to receive a token:

   ```http
   POST /api/v1/auth/login
   Content-Type: application/json

   { "email": "admin@example.com", "password": "password" }
   ```

   Successful response (`200`):

   ```json
   {
     "success": true,
     "message": "Login successful.",
     "data": {
       "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
       "token_type": "Bearer",
       "user": { "id": 1, "name": "System Administrator", "email": "admin@example.com", "role": "admin", "status": "ACTIVE" }
     }
   }
   ```

2. **Send the token** on every protected request:

   ```http
   Authorization: Bearer 1|xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Accept: application/json
   ```

3. **Get the current user**: `GET /api/v1/auth/me`

4. **Log out** (revokes the current token): `POST /api/v1/auth/logout`

Requests without a valid token receive `401` with the standard error envelope.

## API Documentation Location

Interactive API documentation (OpenAPI) is generated by **Scramble** and available while the
server is running:

| Resource | URL |
| --- | --- |
| Swagger-style UI | `http://127.0.0.1:8000/api/docs` |
| Raw OpenAPI 3.1 JSON | `http://127.0.0.1:8000/api/docs.json` |

The documentation is generated **from the actual code** (routes, Form Request rules, and API
Resources), so it stays in sync. It documents each endpoint's method, description, authentication
requirement, path/query parameters, request body, and success/error responses.

You can also export the specification to a file:

```bash
php artisan scramble:export
```

> For security, the docs routes are restricted to the `local` environment (Scramble's
> `RestrictedDocsAccess` middleware), so they are not publicly exposed in production.

## How to Run Tests

The automated suite runs against a **separate MySQL database** so it never touches your
development data. Create it once:

```bash
mysql -u root -p -e "CREATE DATABASE student_api_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

`phpunit.xml` already points the tests at `student_api_testing` and the feature tests use the
`RefreshDatabase` trait, so the schema is rebuilt automatically on every run.

```bash
php artisan test
```

or directly with PHPUnit:

```bash
vendor/bin/phpunit
```

Coverage:

| Area | File | What is covered |
| --- | --- | --- |
| Authentication | `tests/Feature/AuthenticationTest.php` | valid login, wrong password, unknown email, inactive account, missing/invalid/revoked token, logout |
| Students | `tests/Feature/StudentTest.php` | create, retrieve, update, delete, duplicate number, invalid email, invalid program/year, 404 |
| Authorization | `tests/Feature/AuthorizationTest.php` | admin allowed; student/instructor forbidden; object-level student protection; instructor grade ownership |
| Enrollments | `tests/Feature/EnrollmentTest.php` | valid enrollment, duplicate prevention, invalid references, capacity limit, nested listings |
| Grades | `tests/Feature/GradeTest.php` | valid grade with computed remarks, invalid enrollment/range, duplicate grade, unauthorized modification |
| Collections | `tests/Feature/CollectionTest.php` | search, filtering, sorting, pagination, per-page cap, safe sort fallback |
| Academic terms | `tests/Feature/AcademicTermTest.php` | valid/unknown status, date rules, unique term, delete guarded by offerings |
| Unit | `tests/Unit/GradeRemarksTest.php` | the grade remarks rule as pure logic |

The suite currently contains **68 tests** across 10 files, including academic-term update date
validation and duplicate-enrollment-on-update. Run `php artisan test` against the
`student_api_testing` database and capture the pass/assertion count as submission evidence.

## Development Test Accounts

The seeder creates these accounts for local development and demonstration. These are
**development-only** accounts — they are not real credentials and must never be used in
production.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@example.com` | `password` |
| Registrar / Staff | `registrar@example.com` | `password` |
| Instructor | `instructor@example.com` | `password` |
| Instructor | `instructor2@example.com` | `password` |
| Instructor | `instructor3@example.com` | `password` |
| Student | `student@example.com` | `password` |

> The student account is linked to one seeded student profile so object-level authorization can
> be demonstrated (it can read only its own record).

## API Overview

All routes are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/auth/login` | Log in and receive a token | Public |
| POST | `/auth/logout` | Revoke the current token | Bearer |
| GET | `/auth/me` | Get the authenticated user | Bearer |

### Programs

| Method | Endpoint | Description | Roles |
| --- | --- | --- | --- |
| GET | `/programs` | List programs | Admin, Registrar, Instructor |
| POST | `/programs` | Create a program | Admin, Registrar |
| GET | `/programs/{id}` | Show a program | Admin, Registrar, Instructor |
| PUT/PATCH | `/programs/{id}` | Update a program | Admin, Registrar |
| DELETE | `/programs/{id}` | Delete a program (409 if it has students) | Admin, Registrar |

### Students

| Method | Endpoint | Description | Roles |
| --- | --- | --- | --- |
| GET | `/students` | List students | Admin, Registrar |
| POST | `/students` | Create a student | Admin, Registrar |
| GET | `/students/{id}` | Show a student | Admin, Registrar, owning Student |
| PUT/PATCH | `/students/{id}` | Update a student | Admin, Registrar |
| DELETE | `/students/{id}` | Delete a student (409 if enrolled) | Admin, Registrar |
| GET | `/students/{id}/enrollments` | Student's enrollments | Admin, Registrar, owning Student |
| GET | `/students/{id}/grades` | Student's grades | Admin, Registrar, owning Student |
| GET | `/students/{id}/academic-record` | Grades grouped by term | Admin, Registrar, owning Student |

### Courses

| Method | Endpoint | Roles |
| --- | --- | --- |
| GET | `/courses` | Admin, Registrar, Instructor |
| POST | `/courses` | Admin, Registrar |
| GET | `/courses/{id}` | Admin, Registrar, Instructor |
| PUT/PATCH | `/courses/{id}` | Admin, Registrar |
| DELETE | `/courses/{id}` | Admin, Registrar |

### Academic Terms

| Method | Endpoint | Roles |
| --- | --- | --- |
| GET | `/academic-terms` | Admin, Registrar, Instructor |
| POST | `/academic-terms` | Admin, Registrar |
| GET | `/academic-terms/{id}` | Admin, Registrar, Instructor |
| PUT/PATCH | `/academic-terms/{id}` | Admin, Registrar |
| DELETE | `/academic-terms/{id}` | Admin, Registrar |

### Course Offerings

| Method | Endpoint | Roles |
| --- | --- | --- |
| GET | `/course-offerings` | Admin, Registrar (all); Instructor (own only) |
| POST | `/course-offerings` | Admin, Registrar |
| GET | `/course-offerings/{id}` | Admin, Registrar; owning Instructor |
| PUT/PATCH | `/course-offerings/{id}` | Admin, Registrar |
| DELETE | `/course-offerings/{id}` | Admin, Registrar |
| GET | `/course-offerings/{id}/students` | Admin, Registrar; owning Instructor |

### Enrollments

| Method | Endpoint | Roles |
| --- | --- | --- |
| GET | `/enrollments` | Admin, Registrar (all); Instructor (own offerings) |
| POST | `/enrollments` | Admin, Registrar |
| GET | `/enrollments/{id}` | Admin, Registrar, owning Instructor, owning Student |
| PATCH | `/enrollments/{id}` | Admin, Registrar |
| DELETE | `/enrollments/{id}` | Admin, Registrar |

### Grades

| Method | Endpoint | Roles |
| --- | --- | --- |
| GET | `/grades` | Admin, Registrar (all); Instructor (own offerings) |
| POST | `/grades` | Admin, Registrar; owning Instructor |
| GET | `/grades/{id}` | Admin, Registrar, owning Instructor, owning Student |
| PUT/PATCH | `/grades/{id}` | Admin, Registrar; owning Instructor |

> Grades have no `DELETE` endpoint — grades are corrected by updating them, which keeps the
> academic record intact.

## Search, Filtering, Sorting and Pagination

Every collection endpoint accepts the following query parameters:

| Parameter | Meaning | Example |
| --- | --- | --- |
| `search` | Partial-match search across the resource's text fields | `?search=dela` |
| `sort` | Field to sort by (validated against an allow-list) | `?sort=last_name` |
| `direction` | `asc` or `desc` | `?direction=desc` |
| `per_page` | Records per page (1–100, default 15) | `?per_page=20` |
| `page` | Page number | `?page=2` |

Each resource also supports exact-match filters:

| Endpoint | Filters |
| --- | --- |
| `/students` | `program_id`, `year_level`, `status` |
| `/courses` | `status` |
| `/programs` | `status` |
| `/academic-terms` | `semester`, `status` |
| `/course-offerings` | `course_id`, `academic_term_id`, `instructor_id`, `status` |
| `/enrollments` | `student_id`, `course_offering_id`, `status` |
| `/grades` | `enrollment_id` |

Examples:

```
GET /api/v1/students?search=dela
GET /api/v1/students?program_id=1&year_level=3&status=ACTIVE
GET /api/v1/students?sort=last_name&direction=asc&page=2&per_page=20
```

Paginated responses include a `meta` object:

```json
{
  "success": true,
  "message": "Students retrieved successfully.",
  "data": [],
  "meta": {
    "current_page": 2,
    "per_page": 20,
    "total": 100,
    "last_page": 5,
    "from": 21,
    "to": 40
  }
}
```

Unlimited collections are never returned — `per_page` is always capped at 100.

## Response Format and Status Codes

Every response uses a consistent envelope.

**Success:**

```json
{ "success": true, "message": "Student retrieved successfully.", "data": { } }
```

**Error (validation, `422`):**

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": { "email": ["A valid email address is required."] }
}
```

**Error (other):**

```json
{ "success": false, "message": "The provided credentials are incorrect." }
```

| Status | Meaning |
| --- | --- |
| 200 | Successful retrieval/update |
| 201 | Successful creation |
| 401 | Unauthenticated (missing/invalid token) |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Duplicate/conflicting state (duplicate enrollment, capacity reached, dependency exists) |
| 422 | Validation failure |
| 500 | Unexpected server error |

Stack traces, SQL errors, passwords, and tokens are **never** returned in responses (they are
logged only). All `/api/*` requests are forced to return JSON, never HTML.

## Authorization Model

Authorization is enforced **on the server** using Laravel Policies — hiding a button is not a
permission. The four roles are:

- **Administrator** — full access to all resources.
- **Registrar / Staff** — manages students and academic records.
- **Instructor** — views only their assigned course offerings, and may modify grades only for
  enrollments in those offerings.
- **Student** — views only their own profile, enrollments, grades, and academic record.

Object-level checks are what stop a student from reading another student's data by changing the
URL from `/students/1` to `/students/2` (the second request returns `403`).

## Database and ERD

See **[`docs/ERD.md`](docs/ERD.md)** for the entity-relationship diagram (Mermaid), the primary
keys, foreign keys, one-to-many relationships, the one-to-one grade relationship, unique
constraints, and a plain-language explanation.

## Postman Collection

A ready-to-import Postman collection is provided in the [`postman/`](postman/) folder:

| File | Purpose |
| --- | --- |
| `postman/Student-API.postman_collection.json` | All requests, organised into 9 folders |
| `postman/Student-API.postman_environment.json` | `base_url` and `token` variables |

**How to use it:**

1. Import both JSON files into Postman.
2. Select the **Student API (local)** environment.
3. Run **Authentication → Login (admin)** — the test script saves the token into `{{token}}`
   automatically.
4. Run any other request; `{{base_url}}` and `{{token}}` are substituted for you.

The collection is organised into: Authentication, Students, Programs, Courses, Academic Terms,
Course Offerings, Enrollments, Grades, and Academic Records. Each folder includes both
**successful** and **failure** examples (e.g. validation error, duplicate, unauthorized).

## Security Notes

- Passwords are hashed with bcrypt and hidden from all JSON output.
- API tokens are issued by Sanctum and revoked on logout.
- All input is validated with Form Requests before touching the database.
- Eloquent (parameterised queries) is used throughout — no raw string SQL.
- Database-level constraints (unique indexes + foreign keys) back up the validation rules.
- CORS is explicitly configured in `config/cors.php`: only the `api/*` paths are exposed, the
  allowed methods/headers are listed, and browser origins come from the `CORS_ALLOWED_ORIGINS`
  variable instead of a wildcard. Since the API is token-based, credentials are disabled.
- Secrets live only in `.env` (gitignored). A safe `.env.example` is committed.

## AI Tools Used

- **AI coding assistant:** an instructor-approved AI coding assistant (Command Code).
- The assistant was used in **small, verifiable phases** (setup, database, authentication,
  resources, transactions, advanced features, authorization, documentation, testing).

## How AI-Generated Code Was Reviewed and Verified

AI output was never accepted blindly. For this project:

1. **Live verification** — every phase was tested against the running API with real HTTP
   requests (including negative cases such as wrong credentials, missing tokens, and `403`
   authorization checks).
2. **Framework-source checks** — when Laravel 12 behaved differently from expectation (for
   example, the base `Controller` no longer includes the `AuthorizesRequests` trait), the
   framework source was read before applying a fix rather than guessing.
3. **Database-level checks** — duplicate enrollment and unique-field rules were confirmed to be
   enforced by the database, not only by controller code.
4. **Documentation** — the OpenAPI docs are generated from the real code, so the documentation
   cannot drift from the implementation.
5. **Human ownership** — important logic (policies, validation, migrations) is explained so it
   can be defended during the demonstration.
