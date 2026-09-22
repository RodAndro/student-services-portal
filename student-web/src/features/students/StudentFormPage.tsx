import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { ErrorState } from "../../components/data/ErrorState";
import { useToast } from "../../components/feedback/useToast";
import { FormActions } from "../../components/forms/FormActions";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useFormState } from "../../forms/useFormState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useProgramOptions } from "../../hooks/useReferenceOptions";
import { toApiError } from "../../lib/errors";
import { humanizeStatus } from "../../lib/format";
import {
  YEAR_LEVELS,
  emptyStudentForm,
  studentToForm,
  studentToPayload,
  validateStudent
} from "./studentRules";
import type { StudentFormValues } from "./studentRules";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"] as const;

/** Create mode has no id; edit mode loads the record first, then renders the form. */
export function StudentFormPage() {
  const { id } = useParams();
  const studentId = id ? Number(id) : null;

  return <StudentFormLoader studentId={studentId} />;
}

function StudentFormLoader({ studentId }: { studentId: number | null }) {
  const programs = useProgramOptions();
  const studentQuery = useApiQuery(
    () =>
      studentId === null ? Promise.resolve(null) : studentsApi.getStudent(studentId).then(unwrap),
    [studentId]
  );

  const needsStudent = studentId !== null;
  const loading = programs.loading || (needsStudent && studentQuery.loading);
  const error = programs.error ?? (needsStudent ? studentQuery.error : null);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <SkeletonBlock rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          error={error}
          onRetry={() => {
            studentQuery.refetch();
          }}
        />
      </div>
    );
  }

  const student = studentQuery.data;

  return (
    <StudentForm
      studentId={studentId}
      initial={student ? studentToForm(student) : emptyStudentForm}
      programOptions={programs.options}
    />
  );
}

function StudentForm({
  studentId,
  initial,
  programOptions
}: {
  studentId: number | null;
  initial: StudentFormValues;
  programOptions: Array<{ value: string; label: string }>;
}) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = studentId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // The submit button is disabled while a request is in flight; this guard makes the
    // handler itself idempotent, so a second submit event cannot create a duplicate.
    if (submitting) {
      return;
    }

    const errors = validateStudent(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = studentToPayload(form.values);
      const result =
        studentId === null
          ? await studentsApi.createStudent(payload)
          : await studentsApi.updateStudent(studentId, payload);

      toast.show({ tone: "success", title: result.message });
      navigate(`/students/${result.data.id}`, { replace: true });
    } catch (caught: unknown) {
      // The API is the final authority: a duplicate student number or a bad
      // program_id arrives as 422 and lands under the matching field.
      const apiError = toApiError(caught);
      form.applyServerErrors(apiError.fieldErrors);
      setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-sm">
        <Link to="/students" className="text-blue-700 underline hover:text-blue-800">
          ← Back to students
        </Link>
      </p>

      <PageHeader
        title={isEdit ? "Edit student" : "New student"}
        description={
          isEdit
            ? "Update this student's record."
            : "Create a student record. Required fields are marked with an asterisk."
        }
      />

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The student could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Identity
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                htmlFor="student-number"
                label="Student number"
                required
                error={form.errors.student_number}
                hint="Must be unique, maximum 50 characters."
              >
                <Input
                  id="student-number"
                  value={form.values.student_number}
                  invalid={Boolean(form.errors.student_number)}
                  maxLength={50}
                  onChange={(event) => form.setField("student_number", event.target.value)}
                />
              </Field>

              <Field
                htmlFor="student-birth-date"
                label="Birth date"
                error={form.errors.birth_date}
                hint="Must be before today."
              >
                <Input
                  id="student-birth-date"
                  type="date"
                  value={form.values.birth_date}
                  invalid={Boolean(form.errors.birth_date)}
                  onChange={(event) => form.setField("birth_date", event.target.value)}
                />
              </Field>

              <Field
                htmlFor="student-first-name"
                label="First name"
                required
                error={form.errors.first_name}
              >
                <Input
                  id="student-first-name"
                  value={form.values.first_name}
                  invalid={Boolean(form.errors.first_name)}
                  onChange={(event) => form.setField("first_name", event.target.value)}
                />
              </Field>

              <Field
                htmlFor="student-middle-name"
                label="Middle name"
                error={form.errors.middle_name}
              >
                <Input
                  id="student-middle-name"
                  value={form.values.middle_name}
                  invalid={Boolean(form.errors.middle_name)}
                  onChange={(event) => form.setField("middle_name", event.target.value)}
                />
              </Field>

              <Field
                htmlFor="student-last-name"
                label="Last name"
                required
                error={form.errors.last_name}
              >
                <Input
                  id="student-last-name"
                  value={form.values.last_name}
                  invalid={Boolean(form.errors.last_name)}
                  onChange={(event) => form.setField("last_name", event.target.value)}
                />
              </Field>

              <Field htmlFor="student-suffix" label="Suffix" error={form.errors.suffix}>
                <Input
                  id="student-suffix"
                  value={form.values.suffix}
                  invalid={Boolean(form.errors.suffix)}
                  placeholder="Jr., III…"
                  onChange={(event) => form.setField("suffix", event.target.value)}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contact
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                htmlFor="student-email"
                label="Email"
                error={form.errors.email}
                hint="Optional."
              >
                <Input
                  id="student-email"
                  type="email"
                  value={form.values.email}
                  invalid={Boolean(form.errors.email)}
                  onChange={(event) => form.setField("email", event.target.value)}
                />
              </Field>

              <Field
                htmlFor="student-contact"
                label="Contact number"
                error={form.errors.contact_number}
                hint="Optional, maximum 50 characters."
              >
                <Input
                  id="student-contact"
                  value={form.values.contact_number}
                  invalid={Boolean(form.errors.contact_number)}
                  onChange={(event) => form.setField("contact_number", event.target.value)}
                />
              </Field>
            </div>

            <Field htmlFor="student-address" label="Address" error={form.errors.address}>
              <Textarea
                id="student-address"
                value={form.values.address}
                onChange={(event) => form.setField("address", event.target.value)}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Academic
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                htmlFor="student-program"
                label="Program"
                required
                error={form.errors.program_id}
              >
                <Select
                  id="student-program"
                  value={form.values.program_id}
                  invalid={Boolean(form.errors.program_id)}
                  onChange={(event) => form.setField("program_id", event.target.value)}
                >
                  <option value="">Select a program…</option>
                  {programOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                htmlFor="student-year-level"
                label="Year level"
                required
                error={form.errors.year_level}
              >
                <Select
                  id="student-year-level"
                  value={form.values.year_level}
                  invalid={Boolean(form.errors.year_level)}
                  onChange={(event) => form.setField("year_level", event.target.value)}
                >
                  {YEAR_LEVELS.map((year) => (
                    <option key={year} value={String(year)}>
                      Year {year}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field htmlFor="student-status" label="Status" required error={form.errors.status}>
                <Select
                  id="student-status"
                  value={form.values.status}
                  invalid={Boolean(form.errors.status)}
                  onChange={(event) =>
                    form.setField("status", event.target.value as StudentFormValues["status"])
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {humanizeStatus(status)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </fieldset>

          <FormActions
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create student"}
            onCancel={() => navigate("/students")}
          />
        </form>
      </Card>
    </div>
  );
}
