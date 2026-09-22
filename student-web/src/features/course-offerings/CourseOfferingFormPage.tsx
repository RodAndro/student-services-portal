import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { courseOfferingsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
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
import {
  useAcademicTermOptions,
  useCourseOptions,
  useInstructorOptions
} from "../../hooks/useReferenceOptions";
import { toApiError } from "../../lib/errors";
import { humanizeStatus } from "../../lib/format";
import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  COURSE_OFFERING_STATUSES,
  courseOfferingToForm,
  courseOfferingToPayload,
  emptyCourseOfferingForm,
  validateCourseOffering
} from "./courseOfferingRules";
import type { CourseOfferingFormValues } from "./courseOfferingRules";

/** Create mode has no id; edit mode loads the offering first, then renders the form. */
export function CourseOfferingFormPage() {
  const { id } = useParams();
  const offeringId = id ? Number(id) : null;

  return <CourseOfferingFormLoader offeringId={offeringId} />;
}

function CourseOfferingFormLoader({ offeringId }: { offeringId: number | null }) {
  const courses = useCourseOptions();
  const terms = useAcademicTermOptions();
  const instructors = useInstructorOptions();

  const offeringQuery = useApiQuery(
    () =>
      offeringId === null
        ? Promise.resolve(null)
        : courseOfferingsApi.getCourseOffering(offeringId).then(unwrap),
    [offeringId]
  );

  const needsOffering = offeringId !== null;
  const loading = courses.loading || terms.loading || (needsOffering && offeringQuery.loading);
  const error = courses.error ?? terms.error ?? (needsOffering ? offeringQuery.error : null);

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
        <Alert tone="danger" title="Could not load the form">
          <p>{error.message}</p>
        </Alert>
      </div>
    );
  }

  const offering = offeringQuery.data;

  return (
    <CourseOfferingForm
      offeringId={offeringId}
      initial={offering ? courseOfferingToForm(offering) : emptyCourseOfferingForm}
      courseOptions={courses.options}
      termOptions={terms.options}
      instructorOptions={instructors.options}
    />
  );
}

function CourseOfferingForm({
  offeringId,
  initial,
  courseOptions,
  termOptions,
  instructorOptions
}: {
  offeringId: number | null;
  initial: CourseOfferingFormValues;
  courseOptions: Array<{ value: string; label: string }>;
  termOptions: Array<{ value: string; label: string }>;
  instructorOptions: Array<{ value: string; label: string }>;
}) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = offeringId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateCourseOffering(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = courseOfferingToPayload(form.values);
      const result =
        offeringId === null
          ? await courseOfferingsApi.createCourseOffering(payload)
          : await courseOfferingsApi.updateCourseOffering(offeringId, payload);

      toast.show({ tone: "success", title: result.message });
      navigate(`/course-offerings/${result.data.id}`, { replace: true });
    } catch (caught: unknown) {
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
        <Link to="/course-offerings" className="text-blue-700 underline hover:text-blue-800">
          ← Back to course offerings
        </Link>
      </p>

      <PageHeader
        title={isEdit ? "Edit course offering" : "New course offering"}
        description={
          isEdit
            ? "Update this section's details."
            : "Schedule a course for an academic term and assign an instructor."
        }
      />

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The course offering could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field htmlFor="offering-course" label="Course" required error={form.errors.course_id}>
            <Select
              id="offering-course"
              value={form.values.course_id}
              invalid={Boolean(form.errors.course_id)}
              onChange={(event) => form.setField("course_id", event.target.value)}
            >
              <option value="">Select a course…</option>
              {courseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            htmlFor="offering-term"
            label="Academic term"
            required
            error={form.errors.academic_term_id}
          >
            <Select
              id="offering-term"
              value={form.values.academic_term_id}
              invalid={Boolean(form.errors.academic_term_id)}
              onChange={(event) => form.setField("academic_term_id", event.target.value)}
            >
              <option value="">Select an academic term…</option>
              {termOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            htmlFor="offering-instructor"
            label="Instructor"
            required
            error={form.errors.instructor_id}
            hint="The API requires a user whose role is instructor. Seeded instructors - the API exposes no users endpoint."
          >
            <Select
              id="offering-instructor"
              value={form.values.instructor_id}
              invalid={Boolean(form.errors.instructor_id)}
              onChange={(event) => form.setField("instructor_id", event.target.value)}
            >
              <option value="">Select an instructor…</option>
              {instructorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              htmlFor="offering-section"
              label="Section"
              required
              error={form.errors.section}
              hint="Maximum 20 characters (for example A-1)."
            >
              <Input
                id="offering-section"
                value={form.values.section}
                invalid={Boolean(form.errors.section)}
                maxLength={20}
                onChange={(event) => form.setField("section", event.target.value)}
              />
            </Field>

            <Field
              htmlFor="offering-schedule"
              label="Schedule"
              required
              error={form.errors.schedule}
              hint="Free text (for example MWF 08:00)."
            >
              <Input
                id="offering-schedule"
                value={form.values.schedule}
                invalid={Boolean(form.errors.schedule)}
                maxLength={100}
                onChange={(event) => form.setField("schedule", event.target.value)}
              />
            </Field>

            <Field htmlFor="offering-room" label="Room" error={form.errors.room}>
              <Input
                id="offering-room"
                value={form.values.room}
                invalid={Boolean(form.errors.room)}
                onChange={(event) => form.setField("room", event.target.value)}
              />
            </Field>

            <Field
              htmlFor="offering-capacity"
              label="Capacity"
              required
              error={form.errors.capacity}
              hint={`Between ${CAPACITY_MIN} and ${CAPACITY_MAX} students.`}
            >
              <Input
                id="offering-capacity"
                type="number"
                min={CAPACITY_MIN}
                max={CAPACITY_MAX}
                value={form.values.capacity}
                invalid={Boolean(form.errors.capacity)}
                onChange={(event) => form.setField("capacity", event.target.value)}
              />
            </Field>
          </div>

          <Field htmlFor="offering-status" label="Status" required error={form.errors.status}>
            <Select
              id="offering-status"
              value={form.values.status}
              invalid={Boolean(form.errors.status)}
              onChange={(event) =>
                form.setField("status", event.target.value as CourseOfferingFormValues["status"])
              }
            >
              {COURSE_OFFERING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </Select>
          </Field>

          <FormActions
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create course offering"}
            onCancel={() => navigate("/course-offerings")}
          />
        </form>
      </Card>
    </div>
  );
}
