# Entity-Relationship Diagram (ERD)

This diagram shows the database schema for the Student Information Management
API. It is written in Mermaid so it renders on GitHub and in most Markdown
previewers.

```mermaid
erDiagram
    users ||--o| students : "has one profile"
    users ||--o{ course_offerings : "instructs"
    programs ||--o{ students : "has many"
    courses ||--o{ course_offerings : "has many"
    academic_terms ||--o{ course_offerings : "has many"
    students ||--o{ enrollments : "has many"
    course_offerings ||--o{ enrollments : "has many"
    enrollments ||--o| grades : "has one"

    users {
        bigint id PK
        string name
        string email UK
        string password
        string role
        string status
        timestamp created_at
        timestamp updated_at
    }

    programs {
        bigint id PK
        string code UK
        string name
        text description
        string status
        timestamp created_at
        timestamp updated_at
    }

    students {
        bigint id PK
        string student_number UK
        string first_name
        string middle_name
        string last_name
        string suffix
        date birth_date
        string email
        string contact_number
        text address
        bigint program_id FK
        tinyint year_level
        string status
        bigint user_id FK_UK
        timestamp created_at
        timestamp updated_at
    }

    courses {
        bigint id PK
        string course_code UK
        string course_title
        text description
        tinyint units
        string status
        timestamp created_at
        timestamp updated_at
    }

    academic_terms {
        bigint id PK
        string academic_year
        tinyint semester
        date start_date
        date end_date
        string status
        timestamp created_at
        timestamp updated_at
    }

    course_offerings {
        bigint id PK
        bigint course_id FK
        bigint academic_term_id FK
        bigint instructor_id FK
        string section
        string schedule
        string room
        smallint capacity
        string status
        timestamp created_at
        timestamp updated_at
    }

    enrollments {
        bigint id PK
        bigint student_id FK
        bigint course_offering_id FK
        date enrollment_date
        string status
        timestamp created_at
        timestamp updated_at
    }

    grades {
        bigint id PK
        bigint enrollment_id FK_UK
        decimal midterm_grade
        decimal final_grade
        string remarks
        timestamp created_at
        timestamp updated_at
    }
```

Legend:

- **PK** = primary key
- **FK** = foreign key
- **UK** = unique constraint
- **FK_UK** = a foreign key that is also unique (used for one-to-one links)

## Relationships explained in plain English

1. **A program has many students.** One `students` row stores a `program_id`
   that points to exactly one `programs` row. A program (e.g. BSIT) can have
   many students.

2. **A course has many course offerings.** A `courses` row (e.g. CS101) is a
   catalog entry. A `course_offerings` row is a *specific section* of that
   course taught in a specific term (e.g. CS101, section A, first semester).
   So one course can be offered many times.

3. **An academic term has many course offerings.** Every course offering
   happens during one academic term (e.g. 2026-2027, first semester), and one
   term contains many offerings.

4. **An instructor (a user) has many course offerings.** The
   `course_offerings.instructor_id` points to a `users` row whose `role` is
   `instructor`. One instructor teaches many offerings.

5. **A student has many enrollments.** An `enrollments` row joins a student to
   a course offering. One student enrolls in many offerings.

6. **A course offering has many enrollments.** Many students can enroll in the
   same course offering, up to its `capacity`.

7. **An enrollment has one grade.** A `grades` row stores the midterm and final
   grade for exactly one enrollment. The `grades.enrollment_id` is unique, so a
   single enrollment cannot have more than one grade record.

## Data integrity rules shown in the diagram

- `users.email` is **unique** — no two accounts share an email.
- `programs.code` is **unique**.
- `students.student_number` is **unique**.
- `courses.course_code` is **unique**.
- `students.user_id` is a **nullable unique foreign key** — it optionally links
  a student profile to a user account, and each user account links to at most
  one student.
- `academic_terms` has a **unique `(academic_year, semester)`** pair — you
  cannot create the same term twice.
- `enrollments` has a **unique `(student_id, course_offering_id)`** pair — this
  prevents a student from being enrolled twice in the same course offering.
- `grades.enrollment_id` is a **unique foreign key** — one grade per enrollment.

## Indexes for frequently searched fields

These indexes support the API's search, filter, and sort features:

| Table | Indexed column(s) | Why |
| --- | --- | --- |
| `users` | `email` (unique), `role`, `status` | login lookup, role filtering |
| `students` | `student_number` (unique), `last_name`, `year_level`, `status` | search by name/number, filters |
| `programs` | `code` (unique), `status` | catalog lookup |
| `courses` | `course_code` (unique), `status` | catalog lookup |
| `academic_terms` | `(academic_year, semester)` (unique), `status` | term lookup |
| `course_offerings` | `status`, and foreign keys on `course_id`, `academic_term_id`, `instructor_id` | listing/scoping |
| `enrollments` | `(student_id, course_offering_id)` (unique), `status` | duplicate prevention, filters |
| `grades` | `enrollment_id` (unique) | one grade per enrollment |

## Relationship delete behaviour

The foreign keys are not all the same, and the difference matters:

- `enrollments.student_id` and `enrollments.course_offering_id` → **cascade** (deleting a student
  or an offering removes its enrollments).
- `grades.enrollment_id` → **cascade** (deleting an enrollment removes its grade).
- `students.user_id` → **null on delete** (removing the user account keeps the student profile).
- `students.program_id`, `course_offerings.course_id`, `course_offerings.academic_term_id`,
  `course_offerings.instructor_id` → **restrict**. The API therefore returns `409 Conflict` when
  you try to delete a program that still has students, a course that still has offerings, and so
  on, instead of silently orphaning rows.

## Documented status values

Status columns are plain strings (not native database enums) so a new lifecycle value costs a
one-line migration. The API validates input against these lists:

| Column | Allowed values |
| --- | --- |
| `users.status` | `ACTIVE`, `INACTIVE` (only `ACTIVE` accounts may log in) |
| `users.role` | `admin`, `registrar`, `instructor`, `student` |
| `programs.status` | `ACTIVE`, `INACTIVE` |
| `courses.status` | `ACTIVE`, `INACTIVE` |
| `academic_terms.status` | `ACTIVE`, `UPCOMING`, `INACTIVE` |
| `students.status` | `ACTIVE`, `INACTIVE` |
| `course_offerings.status` | `ACTIVE`, `INACTIVE` |
| `enrollments.status` | `ENROLLED`, `DROPPED`, `COMPLETED` |
| `grades.remarks` | `PASSED`, `FAILED`, `IN PROGRESS` (computed, see below) |

> Note: academic terms use `UPCOMING` for a term that has not started yet — a term is
> time-based, so its lifecycle is `UPCOMING` → `ACTIVE` → `INACTIVE`. The demo seeder labels the
> future term `UPCOMING` accordingly.

## Computed value: `grades.remarks`

`remarks` is **not typed in by the user**. It is derived by the `Grade` model whenever a grade is
saved:

- no `final_grade` yet → `IN PROGRESS`
- `final_grade` >= 75 → `PASSED`
- `final_grade` < 75 → `FAILED`

This keeps the pass/fail rule in one place instead of relying on each caller to get it right.

## One-to-one relationships shown

There are two one-to-one links in the schema:

1. **`users` → `students`** — `students.user_id` is a nullable unique foreign key, so a user
   account links to at most one student profile. This is what makes object-level authorization
   possible: the logged-in account is matched to exactly one student record.
2. **`enrollments` → `grades`** — `grades.enrollment_id` is unique, so one enrollment has at most
   one grade record.

