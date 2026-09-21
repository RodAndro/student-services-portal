# Final Demonstration Script

This is the step-by-step demonstration required by the laboratory activity. Every step below has
been executed against the running API and the expected result is what actually happens.

You can perform the steps with **Postman** (import the collection in
[`../postman/`](../postman/)) or with any HTTP client. Read-only steps also include a
`curl.exe` command.

---

## One-time setup

```bash
# 1. Start MySQL, then create the databases (development + tests)
mysql -u root -p -e "CREATE DATABASE student_api;"
mysql -u root -p -e "CREATE DATABASE student_api_testing;"

# 2. Install dependencies and prepare the environment
composer install
cp .env.example .env
php artisan key:generate

# 3. Build the schema and load the demo data
php artisan migrate:fresh --seed
```

## Before you demonstrate

```bash
php artisan serve
```

The API is now at `http://127.0.0.1:8000/api/v1` and the documentation at
`http://127.0.0.1:8000/api/docs`.

**Development accounts** (created by the seeder — development only, never real credentials):

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@example.com` | `password` |
| Registrar / Staff | `registrar@example.com` | `password` |
| Instructor | `instructor@example.com` | `password` |
| Student | `student@example.com` | `password` |

> Postman: import `postman/Student-API.postman_collection.json` and
> `postman/Student-API.postman_environment.json`, then select the **Student API (local)**
> environment. The collection is organised into the same nine folders listed below, and each
> create request saves its new id into a variable so later requests chain automatically.

---

## The 25 required steps

### 1. Start the REST API

```bash
curl.exe "http://127.0.0.1:8000/api/v1/ping"
```

**Expected:** `200` with `{"success": true, "message": "API is running.", ...}`.

### 2. Connect to the database

**Postman:** Authentication → **Login (admin)**. Then Students → **List students**.

**Expected:** login returns a token; listing students returns rows that could only come from
MySQL. (If the database were down, the request would fail with a `500`.)

### 3. Authenticate successfully

**Postman:** Authentication → **Login (admin)**.

```bash
curl.exe -X POST "http://127.0.0.1:8000/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"password\"}"
```

**Expected:** `200` with `data.token`, `data.token_type = "Bearer"`, and `data.user`
(**no password field**). The Postman test script stores the token in `{{token}}`.

### 4. Show a protected endpoint rejecting an unauthenticated request

**Postman:** Authentication → **Me - no token (401)**. (Or omit the `Authorization` header.)

**Expected:** `401` `{"success": false, "message": "Unauthenticated."}`.

### 5. Create a program

**Postman:** Programs → **Create program (201)**.

```http
POST /api/v1/programs
Authorization: Bearer <token>
Content-Type: application/json

{ "code": "BSIT", "name": "BS Information Technology", "status": "ACTIVE" }
```

**Expected:** `201` with the created program in `data`.

### 6. Create a valid student

**Postman:** Students → **Create student (201)**.

```http
POST /api/v1/students
Authorization: Bearer <token>

{
  "student_number": "2026-00001",
  "first_name": "Maria",
  "middle_name": "Santos",
  "last_name": "Dela Cruz",
  "email": "maria@example.com",
  "program_id": 1,
  "year_level": 2,
  "status": "ACTIVE"
}
```

**Expected:** `201` with `data.full_name = "Maria Santos Dela Cruz"`.

### 7. Show invalid / duplicate student validation

**Postman:** Students → **Duplicate student number (422)** and **Invalid email (422)**.

- Sending the same `student_number` again → `422` with
  `errors.student_number`: the number is protected by a **unique database index**, not only by
  the controller.
- Sending `"email": "not-an-email"` → `422` with `errors.email`, and **nothing is saved**.

### 8. Retrieve a student

**Postman:** Students → **Get student**.

**Expected:** `200` with the student's details.

### 9. Update a student

**Postman:** Students → **Update student** (`PUT /api/v1/students/{id}` with `{"year_level": 4}`).

**Expected:** `200`, and the returned `data.year_level` is `4`.

### 10. Search a student

**Postman:** Students → **List students (search)**.

```http
GET /api/v1/students?search=dela
```

**Expected:** `200`; only students whose name/number/email partially matches are returned.

### 11. Filter students

**Postman:** Students → **List students (filter + sort)**.

```http
GET /api/v1/students?program_id=1&year_level=3&status=ACTIVE
```

**Expected:** `200` with only matching students and a `meta.total` count.

### 12. Show pagination

**Postman:** Students → **List students (pagination)**.

```http
GET /api/v1/students?page=2&per_page=10
```

**Expected:** `200` with `meta = { current_page: 2, per_page: 10, total: ..., last_page: ... }`.
Point out that `per_page` is capped at 100 — collections are never returned in full.

### 13. Show sorting

**Postman:** Students → **List students (filter + sort)**.

```http
GET /api/v1/students?sort=last_name&direction=asc
```

**Expected:** `200` with students ordered by surname. An unknown `sort` value safely falls back
to the default (it cannot be used to inject SQL).

### 14. Create a course

**Postman:** Courses → **Create course (201)**.

```http
POST /api/v1/courses
{ "course_code": "CS101", "course_title": "Introduction to Computing", "units": 3, "status": "ACTIVE" }
```

**Expected:** `201`.

### 15. Create an academic term

**Postman:** Academic Terms → **Create academic term (201)**.

```http
POST /api/v1/academic-terms
{ "academic_year": "2026-2027", "semester": 1, "start_date": "2026-08-10", "end_date": "2026-12-18", "status": "ACTIVE" }
```

**Expected:** `201`. Creating the same year + semester again returns `422`.

### 16. Create a course offering

**Postman:** Course Offerings → **Create course offering (201)**.

```http
POST /api/v1/course-offerings
{
  "course_id": 21, "academic_term_id": 3, "instructor_id": 3,
  "section": "A-1", "schedule": "MWF 08:00", "room": "Room 201",
  "capacity": 40, "status": "ACTIVE"
}
```

**Expected:** `201`. Note `instructor_id` must be an existing user whose role is `instructor`
(anything else → `422`).

### 17. Enroll a student

**Postman:** Enrollments → **Create enrollment (201)**.

```http
POST /api/v1/enrollments
{ "student_id": 1, "course_offering_id": 21 }
```

**Expected:** `201` with `data.status = "ENROLLED"`.

### 18. Prevent duplicate enrollment

**Postman:** Enrollments → **Duplicate enrollment (409)**.

**Expected:** `409` with a clear message. The `(student_id, course_offering_id)` pair has a
**unique index**, so the database itself refuses the duplicate — even if two requests arrive at
the same time.

### 19. Add / update an authorized grade

**Postman:** Grades → **Create grade (201)**, then **Update grade (owning instructor)**.

```http
POST /api/v1/grades
{ "enrollment_id": 201, "midterm_grade": 88, "final_grade": 90 }
```

**Expected:** `201`, and `data.remarks = "PASSED"` (the remark is computed by the model, not
typed in). Then update it as the instructor who owns the offering → `200`.

**Also show:** Grades → **Forbidden - other instructor updates grade (403)** — a different
instructor is rejected.

### 20. Retrieve the academic record

**Postman:** Academic Records → **Academic record (admin)**.

```http
GET /api/v1/students/1/academic-record
```

**Expected:** `200` with `data.academic_record` — the student's courses and grades **grouped by
academic term**.

### 21. Show a forbidden unauthorized request

**Postman:** Academic Records → **Forbidden - other student's record (403)** (or Students →
**Forbidden - student reads another student (403)**).

Log in as the Student and request a student id that is **not** theirs.

**Expected:** `403`. This is the object-level check: changing `/students/1` to `/students/2` does
not expose another student's data.

### 22. Show a 404 request

**Postman:** Students → **Student not found (404)**.

```http
GET /api/v1/students/999999
```

**Expected:** `404` with `{"success": false, "message": "Not found."}` — JSON, never an HTML
error page or a stack trace.

### 23. Display the API documentation

Open `http://127.0.0.1:8000/api/docs` in a browser (raw OpenAPI JSON at `/api/docs.json`).

**Expected:** interactive OpenAPI documentation generated from the code, showing every endpoint,
its authentication requirement, path/query parameters, request body, and success/error responses.

### 24. Run the automated tests

```bash
php artisan test
```

**Expected:** `64 passed (178 assertions)`.

### 25. Explain one AI-generated contribution

Pick one and explain what the AI proposed, what you changed, and why it is correct. A good
example is the **object-level authorization** in `app/Policies/StudentPolicy.php`:

```php
public function view(User $user, Student $student): bool
{
    return $user->isStudent() && $user->student?->id === $student->id;
}
```

**Explanation points to make:**

- The AI proposed using a Laravel Policy for authorization (rather than `if` statements in the
  controller), which keeps the rule in one file and enforces it on the server.
- The rule compares the **linked student profile** of the logged-in account with the requested
  student, so `/students/2` returns `403` for a student who owns profile 1. Hiding the button in a
  UI would not be enough.
- You verified it with both a live request and an automated test
  (`tests/Feature/AuthorizationTest.php > student cannot view another students record`).
- A real bug was found and fixed during development: in Laravel 12 the base `Controller` no
  longer includes the `AuthorizesRequests` trait, so `$this->authorize(...)` threw an error until
  the trait was added back.

---

## Fast path (if you are short on time)

Run the **Postman collection top to bottom**. Running every folder in order performs steps 1–23
automatically (each folder has green/red test assertions), then run `php artisan test` for step
24 and give the explanation in step 25.
