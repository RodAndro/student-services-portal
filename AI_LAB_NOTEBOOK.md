# AI-Assisted Development Lab Notes

This file is the top-level index for the AI-assisted development carried out across the project.
The detailed, evidence-backed records live with the project that produced them (see the links
below). This index does not restate claims that are not backed by those records.

## AI tool

An instructor-approved AI coding assistant (Command Code), used in small, verifiable phases.

## Where the actual AI work is recorded

| Activity | Project | Authoritative record |
| --- | --- | --- |
| Activity I — TypeScript status formatter | `src/` | the original notes below (kept for history) |
| Activity II — Laravel REST API | `student-api/` | [`student-api/README.md`](student-api/README.md) → "AI Tools Used" and "How AI-Generated Code Was Reviewed and Verified" |
| Activity III — React frontend | `student-web/` | [`student-web/docs/AI-DEVELOPMENT-LOG.md`](student-web/docs/AI-DEVELOPMENT-LOG.md) — task → prompt → AI result → human review → evidence per phase |

## Activity II (Laravel REST API) — summary

The backend (`student-api/`) was built in phases (setup, database, authentication, resources,
transactions, advanced features, authorization, documentation, testing). Each phase was verified
against the running API with real HTTP requests (including negative cases), and framework behavior
was checked against the Laravel source rather than assumed. The AI never replaced human ownership:
policies, validation, and migrations are explained and testable.

Evidence: `student-api/tests/Feature/*` and `tests/Unit/*`, the Postman collection in
`student-api/postman/`, and the live OpenAPI docs generated from the code.

## Activity III (React frontend) — summary

The frontend (`student-web/`) was built against the frozen backend contract. Every phase records the
prompt, what the AI produced, what was accepted/modified/rejected and why, and how it was verified
(test run, live assertion, or build). The full suite is 132 tests; the jsdom tests mock only the
network boundary so URL/query/body/headers are still exercised.

Evidence: `student-web/docs/AI-DEVELOPMENT-LOG.md`, `student-web/src/**/__tests__/*`, and
`student-web/scripts/verify-api.ps1`.

---

## Activity I — original notes (kept for history)

### AI Tool

Instructor-approved AI coding assistant.

### Prompt Used

"Suggest a TypeScript implementation for converting active/inactive status into readable labels,
explain the implementation, identify possible edge cases, and avoid using any."

### AI Recommendation

Use a narrow string union for valid statuses and a small function that checks the value explicitly:

```ts
type StudentStatus = "active" | "inactive";

function getStudentStatusLabel(status: StudentStatus): string {
  if (status === "active") {
    return "Active Student";
  }

  return "Inactive Student";
}
```

### What I Understood

This approach is preferable because it uses a restricted type instead of `any`, keeps the logic
clear and predictable, and makes invalid states harder to pass into the function at compile time.

### Recommendation Accepted

Yes.

### Recommendation Modified

I kept the same core logic, but I integrated it with the project's existing `Student` type and
validation helpers to fit the application context.

### Recommendation Rejected

None.

### Reason

The AI recommendation aligned with the project requirements and TypeScript best practices without
introducing unsafe or overly broad types.

### Requirement Check

- No `any` used.
- Status mapping is explicit.
- The implementation is readable and easy to verify.
- It matches the acceptance criteria for active and inactive values.
