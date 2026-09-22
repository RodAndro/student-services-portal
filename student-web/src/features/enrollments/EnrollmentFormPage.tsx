import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { courseOfferingsApi, enrollmentsApi, studentsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
import { RemoteSelect } from "../../components/data/RemoteSelect";
import { useToast } from "../../components/feedback/useToast";
import { FormActions } from "../../components/forms/FormActions";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input, Select } from "../../components/ui/Input";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useFormState } from "../../forms/useFormState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { toApiError } from "../../lib/errors";
import { humanizeStatus } from "../../lib/format";
import {
  ENROLLMENT_STATUS_OPTIONS,
  emptyEnrollmentForm,
  enrollmentToForm,
  enrollmentToPayload,
  validateEnrollment
} from "./enrollmentRules";
import type { EnrollmentFormValues } from "./enrollmentRules";

/** Create mode has no id; edit mode loads the enrollment first. */
export function EnrollmentFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const enrollmentId = id ? Number(id) : null;

  const prefilled: EnrollmentFormValues = {
    ...emptyEnrollmentForm,
    student_id: searchParams.get("student_id") ?? "",
    course_offering_id: searchParams.get("course_offering_id") ?? ""
  };

  return <EnrollmentFormLoader enrollmentId={enrollmentId} prefilled={prefilled} />;
}

function EnrollmentFormLoader({
  enrollmentId,
  prefilled
}: {
  enrollmentId: number | null;
  prefilled: EnrollmentFormValues;
}) {
  const query = useApiQuery(
    () =>
      enrollmentId === null
        ? Promise.resolve(null)
        : enrollmentsApi.getEnrollment(enrollmentId).then(unwrap),
    [enrollmentId]
  );

  if (enrollmentId !== null) {
    return (
      <div className="mx-auto max-w-3xl">
        <DataState
          loading={query.loading}
          error={query.error}
          data={query.data}
          onRetry={query.refetch}
          loadingFallback={<SkeletonBlock rows={5} />}
          emptyTitle="Enrollment not found"
        >
          {(enrollment) => (
            <EnrollmentForm enrollmentId={enrollmentId} initial={enrollmentToForm(enrollment)} />
          )}
        </DataState>
      </div>
    );
  }

  return <EnrollmentForm enrollmentId={null} initial={prefilled} />;
}

function EnrollmentForm({
  enrollmentId,
  initial
}: {
  enrollmentId: number | null;
  initial: EnrollmentFormValues;
}) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const isEdit = enrollmentId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setConflict(null);

    const errors = validateEnrollment(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = enrollmentToPayload(form.values);
      const result =
        enrollmentId === null
          ? await enrollmentsApi.createEnrollment(payload)
          : await enrollmentsApi.updateEnrollment(enrollmentId, payload);

      toast.show({ tone: "success", title: result.message });
      navigate(`/students/${result.data.student_id}`, { replace: true });
    } catch (caught: unknown) {
      const apiError = toApiError(caught);

      // 409 is the interesting one here: already enrolled, or the offering is full.
      // The API's wording is shown as-is because it says exactly which happened.
      if (apiError.status === 409) {
        setConflict(apiError.message);
      } else {
        form.applyServerErrors(apiError.fieldErrors);
        setFormError(apiError.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-sm">
        <Link to="/enrollments" className="text-blue-700 underline hover:text-blue-800">
          ← Back to enrollments
        </Link>
      </p>

      <PageHeader
        title={isEdit ? "Edit enrollment" : "New enrollment"}
        description={
          isEdit
            ? "Update the enrollment date or status."
            : "Enrolling posts the student id and the course offering id - there is no nested route."
        }
      />

      {conflict ? (
        <div className="mb-4">
          <Alert tone="warning" title="The enrollment was refused">
            <p>{conflict}</p>
          </Alert>
        </div>
      ) : null}

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The enrollment could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <RemoteSelect
            id="enrollment-student"
            label="Student"
            required
            value={form.values.student_id}
            onChange={(value) => form.setField("student_id", value)}
            error={form.errors.student_id}
            placeholder="Select a student…"
            searchPlaceholder="Search by name, number or email…"
            loadOptions={(search) =>
              studentsApi.listStudents({ search: search || undefined, per_page: 20 }).then((page) =>
                page.data.map((student) => ({
                  value: String(student.id),
                  label: `${student.student_number} — ${student.full_name}`
                }))
              )
            }
          />

          <RemoteSelect
            id="enrollment-offering"
            label="Course offering"
            required
            value={form.values.course_offering_id}
            onChange={(value) => form.setField("course_offering_id", value)}
            error={form.errors.course_offering_id}
            placeholder="Select a course offering…"
            searchPlaceholder="Search section, schedule or room…"
            loadOptions={(search) =>
              courseOfferingsApi
                .listCourseOfferings({ search: search || undefined, per_page: 20 })
                .then((page) =>
                  page.data.map((offering) => ({
                    value: String(offering.id),
                    label: `${offering.course?.course_code ?? `Course #${offering.course_id}`} · ${offering.section} · ${offering.schedule} (${offering.enrollments_count ?? 0}/${offering.capacity})`
                  }))
                )
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              htmlFor="enrollment-date"
              label="Enrollment date"
              error={form.errors.enrollment_date}
              hint="Leave empty to let the API use today's date."
            >
              <Input
                id="enrollment-date"
                type="date"
                value={form.values.enrollment_date}
                invalid={Boolean(form.errors.enrollment_date)}
                onChange={(event) => form.setField("enrollment_date", event.target.value)}
              />
            </Field>

            <Field htmlFor="enrollment-status" label="Status" required error={form.errors.status}>
              <Select
                id="enrollment-status"
                value={form.values.status}
                invalid={Boolean(form.errors.status)}
                onChange={(event) =>
                  form.setField("status", event.target.value as EnrollmentFormValues["status"])
                }
              >
                {ENROLLMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <FormActions
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create enrollment"}
            onCancel={() => navigate("/enrollments")}
          />
        </form>
      </Card>
    </div>
  );
}
