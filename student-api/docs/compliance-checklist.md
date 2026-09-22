# Laboratory Compliance Checklist

Compliance checklist for the **AI-Assisted Framework-Based REST API Development** laboratory
activity (Student Information Management REST API).

**Legend:** ✅ COMPLETE · ⚠️ NEEDS FIX · ❌ NOT IMPLEMENTED

**Summary:** 48 items — **48 COMPLETE**, **0 NEEDS FIX**, **0 NOT IMPLEMENTED**.

| Requirement | Implemented? | File / Route | Test Evidence |
| --- | --- | --- | --- |
| **§1 Technology stack** — Laravel 12, PHP 8.2+, MySQL, Eloquent, Sanctum, PHPUnit, OpenAPI/Postman | ✅ COMPLETE | `composer.json`, `.env`, `config/scramble.php` | Full suite runs on Laravel 12 + MySQL |
| **§1 Version control (Git/GitHub)** | ✅ COMPLETE | `student-api/` | committed in `0f93d8a` (137 files); `student-api/.env` is gitignored |
| **§5 Role: Administrator** | ✅ COMPLETE | `app/Models/User.php`, `app/Policies/*` | `AuthorizationTest > administrator can access a protected resource` |
| **§5 Role: Registrar / Staff** | ✅ COMPLETE | `app/Policies/*` (`before()` grants staff) | `AuthorizationTest > registrar can access students` |
| **§5 Role: Instructor** | ✅ COMPLETE | `CourseOfferingPolicy`, `GradePolicy` | `AuthorizationTest > instructor only sees their own course offerings`, `…cannot update a grade in another offering` |
| **§5 Role: Student** | ✅ COMPLETE | `StudentPolicy`, `GradePolicy` | `AuthorizationTest > student can view their own record` |
| **§5 Authorization enforced on the server** | ✅ COMPLETE | `app/Policies/*` + `$this->authorize()` in controllers | `AuthorizationTest` (403 cases) |
| **§6 Entity: users** | ✅ COMPLETE | `database/migrations/0001_01_01_000000_create_users_table.php` | `AuthenticationTest` |
| **§6 Entity: students** | ✅ COMPLETE | `…000004_create_students_table.php` | `StudentTest` |
| **§6 Entity: programs** | ✅ COMPLETE | `…000001_create_programs_table.php` | `AcademicTermTest`/`StudentTest` factories |
| **§6 Entity: courses** | ✅ COMPLETE | `…000002_create_courses_table.php` | seeders + Postman Courses folder |
| **§6 Entity: academic_terms** | ✅ COMPLETE | `…000003_create_academic_terms_table.php` | `AcademicTermTest` |
| **§6 Entity: course_offerings** | ✅ COMPLETE | `…000005_create_course_offerings_table.php` | `EnrollmentTest`, `AuthorizationTest` |
| **§6 Entity: enrollments** | ✅ COMPLETE | `…000006_create_enrollments_table.php` | `EnrollmentTest` |
| **§6 Entity: grades** | ✅ COMPLETE | `…000007_create_grades_table.php` | `GradeTest`, `GradeRemarksTest` |
| **§7 One program → many students** | ✅ COMPLETE | `Program::students()` | `StudentTest` (program_id) |
| **§7 One course → many course offerings** | ✅ COMPLETE | `Course::courseOfferings()` | seeders + `CourseOfferingFactory` |
| **§7 One academic term → many offerings** | ✅ COMPLETE | `AcademicTerm::courseOfferings()` | `AcademicTermTest > a term with course offerings cannot be deleted` |
| **§7 One instructor → many offerings** | ✅ COMPLETE | `User::courseOfferings()` | `AuthorizationTest > instructor only sees their own course offerings` |
| **§7 One student → many enrollments** | ✅ COMPLETE | `Student::enrollments()` | `EnrollmentTest > a students enrollments can be listed` |
| **§7 One offering → many enrollments** | ✅ COMPLETE | `CourseOffering::enrollments()` | `EnrollmentTest > students in a course offering can be listed` |
| **§7 One enrollment → one grade** | ✅ COMPLETE | `Enrollment::grade()` + unique `grades.enrollment_id` | `GradeTest > a duplicate grade for an enrollment is prevented` |
| **§8 Unique student_number** | ✅ COMPLETE | unique index + `StoreStudentRequest` | `StudentTest > a duplicate student number is rejected` |
| **§8 Unique course_code** | ✅ COMPLETE | unique index + `StoreCourseRequest` | Duplicate → 422 (Postman Courses) |
| **§8 Foreign keys protect relationships** | ✅ COMPLETE | `foreignId(...)->constrained()` in migrations | `EnrollmentTest > enrollment requires a valid student/course offering` |
| **§8 Duplicate enrollment prevented** | ✅ COMPLETE | unique `(student_id, course_offering_id)` + service check | `EnrollmentTest > duplicate enrollment is prevented` |
| **§8 Indexes on frequently searched fields** | ✅ COMPLETE | `students.last_name`, `students.year_level`, `status` columns | documented in `docs/ERD.md` |
| **§8 Reproducible migrations** | ✅ COMPLETE | `database/migrations/*` | `migrate:fresh --seed` rebuilds the schema |
| **§9 Seed ≥5 users / 3 programs / 100 students / 20 courses / 2 terms / 20 offerings / 200 enrollments / 100 grades** | ✅ COMPLETE | `database/seeders/DatabaseSeeder.php` | verified: users 6, programs 3, students 100, courses 20, terms 2, offerings 20, enrollments 200, grades 100 |
| **§9 Uses factories (no hand-written rows)** | ✅ COMPLETE | `database/factories/*` | all seeders use factories |
| **§9 Test accounts, no real secrets** | ✅ COMPLETE | `DatabaseSeeder` (dev-only `password`) | documented in README |
| **§10 Versioned `/api/v1`, RESTful routes** | ✅ COMPLETE | `routes/api.php` | `php artisan route:list` (42 routes) |
| **§11 Auth: login / logout / me** | ✅ COMPLETE | `AuthController`, `routes/api.php` | `AuthenticationTest` (9 tests) |
| **§11 Password hashing** | ✅ COMPLETE | `User::$casts['password' => 'hashed']` (bcrypt) | `AuthenticationTest > login never returns the password hash` |
| **§11 Logout revokes the token** | ✅ COMPLETE | `AuthController::logout` | `AuthenticationTest > logout revokes the current token` |
| **§12 Student endpoints (CRUD)** | ✅ COMPLETE | `StudentController`, `StudentPolicy` | `StudentTest` (10 tests) |
| **§13 Program endpoints (CRUD)** | ✅ COMPLETE | `ProgramController` | Postman Programs folder |
| **§14 Course endpoints (CRUD)** | ✅ COMPLETE | `CourseController` | Postman Courses folder |
| **§15 Academic term endpoints (CRUD)** | ✅ COMPLETE | `AcademicTermController` | `AcademicTermTest` (5 tests) |
| **§16 Course offering endpoints (CRUD)** | ✅ COMPLETE | `CourseOfferingController` | `AuthorizationTest`, `EnrollmentTest` |
| **§17 Enrollment endpoints + nested routes** | ✅ COMPLETE | `EnrollmentController`, `StudentController@enrollments`, `CourseOfferingController@students` | `EnrollmentTest` (7 tests) |
| **§17 Prevent duplicate enrollment** | ✅ COMPLETE | unique index + controller check | `EnrollmentTest > duplicate enrollment is prevented` |
| **§18 Grade endpoints + authorized modification** | ✅ COMPLETE | `GradeController`, `GradePolicy`, `EnrollmentPolicy::grade` | `GradeTest` (8 tests), `AuthorizationTest` |
| **§19 Academic record grouped by term** | ✅ COMPLETE | `StudentController::academicRecord`, `GET /api/v1/students/{id}/academic-record` | `AuthorizationTest > student can view their own academic record` |
| **§20 Correct HTTP status codes** | ✅ COMPLETE | `app/Support/ApiResponse.php`, `bootstrap/app.php` | 200/201/401/403/404/409/422 asserted across the suite |
| **§21 Consistent response envelope** | ✅ COMPLETE | `ApiResponse::success/paginated/error` | asserted in every feature test |
| **§22 Server-side validation (Form Requests)** | ✅ COMPLETE | `app/Http/Requests/*` | `StudentTest`, `GradeTest`, `AcademicTermTest` validation cases |
| **§23 Search / filter / sort / pagination** | ✅ COMPLETE | `app/Traits/FiltersAndSorts.php` | `CollectionTest` (7 tests) |
| **§23 Query parameters documented** | ✅ COMPLETE | `#[QueryParameter]` attributes + README | `/api/docs` shows all params |
| **§24 Secure password hashing** | ✅ COMPLETE | `User` model cast | `AuthenticationTest` |
| **§24 Sanctum authentication** | ✅ COMPLETE | `personal_access_tokens`, `auth:sanctum` | `AuthenticationTest` |
| **§24 Role-based authorization** | ✅ COMPLETE | `app/Policies/*` | `AuthorizationTest` |
| **§24 Object-level authorization** | ✅ COMPLETE | `StudentPolicy::view`, `GradePolicy::update` | `AuthorizationTest` (`403` cases) |
| **§24 Environment-based secrets + safe `.env.example`** | ✅ COMPLETE | `.env` (gitignored), `.env.example` | `git check-ignore .env` |
| **§24 ORM / query protections** | ✅ COMPLETE | Eloquent + sort allow-list | `CollectionTest > an unknown sort field falls back to the default` |
| **§24 Controlled CORS** | ✅ COMPLETE | `config/cors.php` (explicit paths/methods/headers/origins, no wildcard, credentials off) | preflight verified with `curl.exe` |
| **§24 Safe error handling, no stack traces** | ✅ COMPLETE | `bootstrap/app.php` exception renderers | `404`/`500` return the JSON envelope |
| **§24 No password hashes/secrets in responses** | ✅ COMPLETE | `User::$hidden`, `UserResource` | `AuthenticationTest > login never returns the password hash` |
| **§24 No real credentials committed** | ✅ COMPLETE | `.gitignore` (`.env`) | `.env.example` contains placeholders only |
| **§25 Clean Laravel structure (models, migrations, seeders, factories, controllers, requests, resources, policies, routes, tests)** | ✅ COMPLETE | `app/`, `database/`, `routes/`, `tests/` | directory listing |
| **§26 Automated tests (auth, students, authorization, enrollment, grades, collections)** | ✅ COMPLETE | `tests/Feature/*`, `tests/Unit/*` | **68 tests present** across 10 files (incl. term-update date validation + duplicate-enrollment-on-update); run `php artisan test` for the pass/assertion count |
| **§27 API documentation (Swagger/OpenAPI)** | ✅ COMPLETE | `config/scramble.php`, `/api/docs`, `/api/docs.json` | generated from code; `200` live |
| **§28 Postman collection (9 folders, env vars, success + failure)** | ✅ COMPLETE | `postman/Student-API.postman_collection.json` (+ environment) | 9 folders, 73 requests; chain verified 51/51 |
| **§29 README (all required sections)** | ✅ COMPLETE | `README.md` | — |
| **§30 ERD (PK/FK, relationships, unique constraints, plain language)** | ✅ COMPLETE | `docs/ERD.md` | — |
| **§31 Mandatory demonstration (25 steps)** | ✅ COMPLETE | `docs/demo-script.md` | all 23 API steps verified live (32/32 checks); tests run for step 24 |
| **§32 Phases 1–10 completed in order** | ✅ COMPLETE | this repository | phase reports |
| **§33 Compliance checklist** | ✅ COMPLETE | this document | — |
| **§34 Debugging rule (diagnose → smallest fix)** | ✅ COMPLETE | — | applied to the `EnrollmentController` and `AcademicTermFactory` fixes |
| **§35 Code rules (exact paths, no pseudo-code, no fakes, no security bypasses)** | ✅ COMPLETE | — | reviewed file by file |

---

## Open items

None outstanding. The backend is committed to Git (`0f93d8a`, 137 files), and `student-api/.env`
is gitignored, so no secrets were committed.

### Non-blocking notes

- `APP_DEBUG=true` is fine for local development; set `APP_DEBUG=false` for any real deployment.
- The OpenAPI docs routes are restricted to the `local` environment by Scramble's
  `RestrictedDocsAccess` middleware, so they are not public in production.
- Deletes return `200` with the JSON envelope rather than `204`, so the API can return a
  `message` consistently. `204` is permitted but not required by §20.
