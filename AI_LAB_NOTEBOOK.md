# AI-Assisted Development Lab Notes

## AI Tool

Instructor-approved AI coding assistant.

## Prompt Used

"Suggest a TypeScript implementation for converting active/inactive status into readable labels, explain the implementation, identify possible edge cases, and avoid using any."

## AI Recommendation

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

## What I Understood

This approach is preferable because it uses a restricted type instead of `any`, keeps the logic clear and predictable, and makes invalid states harder to pass into the function at compile time.

## Recommendation Accepted

Yes.

## Recommendation Modified

I kept the same core logic, but I integrated it with the project’s existing `Student` type and validation helpers to fit the application context.

## Recommendation Rejected

None.

## Reason

The AI recommendation aligned with the project requirements and TypeScript best practices without introducing unsafe or overly broad types.

## Requirement Check

- No `any` used.
- Status mapping is explicit.
- The implementation is readable and easy to verify.
- It matches the acceptance criteria for active and inactive values.
