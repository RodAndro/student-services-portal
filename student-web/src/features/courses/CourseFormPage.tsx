import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { coursesApi } from "../../api";
import { COURSE_STATUSES, COURSE_UNITS_MAX, COURSE_UNITS_MIN } from "../../api/courses.api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
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
import { toApiError } from "../../lib/errors";
import { humanizeStatus } from "../../lib/format";
import { courseToForm, courseToPayload, emptyCourseForm, validateCourse } from "./courseRules";
import type { CourseFormValues } from "./courseRules";

/** Create mode has no id; edit mode loads the record first, then renders the form. */
export function CourseFormPage() {
  const { id } = useParams();
  const courseId = id ? Number(id) : null;

  return courseId === null ? (
    <CourseForm courseId={null} initial={emptyCourseForm} />
  ) : (
    <CourseFormLoader courseId={courseId} />
  );
}

function CourseFormLoader({ courseId }: { courseId: number }) {
  const query = useApiQuery(() => coursesApi.getCourse(courseId).then(unwrap), [courseId]);

  return (
    <div className="mx-auto max-w-3xl">
      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        loadingFallback={<SkeletonBlock rows={5} />}
      >
        {(course) => <CourseForm courseId={courseId} initial={courseToForm(course)} />}
      </DataState>
    </div>
  );
}

function CourseForm({ courseId, initial }: { courseId: number | null; initial: CourseFormValues }) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = courseId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateCourse(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = courseToPayload(form.values);
      const result =
        courseId === null
          ? await coursesApi.createCourse(payload)
          : await coursesApi.updateCourse(courseId, payload);

      toast.show({ tone: "success", title: result.message });
      navigate(`/courses/${result.data.id}`, { replace: true });
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
        <Link to="/courses" className="text-blue-700 underline hover:text-blue-800">
          ← Back to courses
        </Link>
      </p>

      <PageHeader
        title={isEdit ? "Edit course" : "New course"}
        description={isEdit ? "Update the course details." : "Add a course to the catalogue."}
      />

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The course could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            htmlFor="course-code"
            label="Course code"
            required
            error={form.errors.course_code}
            hint="Unique code, maximum 20 characters (for example CS101)."
          >
            <Input
              id="course-code"
              value={form.values.course_code}
              invalid={Boolean(form.errors.course_code)}
              maxLength={20}
              onChange={(event) => form.setField("course_code", event.target.value)}
            />
          </Field>

          <Field
            htmlFor="course-title"
            label="Course title"
            required
            error={form.errors.course_title}
          >
            <Input
              id="course-title"
              value={form.values.course_title}
              invalid={Boolean(form.errors.course_title)}
              onChange={(event) => form.setField("course_title", event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              htmlFor="course-units"
              label="Units"
              required
              error={form.errors.units}
              hint={`Between ${COURSE_UNITS_MIN} and ${COURSE_UNITS_MAX}.`}
            >
              <Input
                id="course-units"
                type="number"
                min={COURSE_UNITS_MIN}
                max={COURSE_UNITS_MAX}
                value={form.values.units}
                invalid={Boolean(form.errors.units)}
                onChange={(event) => form.setField("units", event.target.value)}
              />
            </Field>

            <Field htmlFor="course-status" label="Status" required error={form.errors.status}>
              <Select
                id="course-status"
                value={form.values.status}
                invalid={Boolean(form.errors.status)}
                onChange={(event) =>
                  form.setField("status", event.target.value as CourseFormValues["status"])
                }
              >
                {COURSE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {humanizeStatus(status)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field htmlFor="course-description" label="Description" error={form.errors.description}>
            <Textarea
              id="course-description"
              value={form.values.description}
              onChange={(event) => form.setField("description", event.target.value)}
            />
          </Field>

          <FormActions
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create course"}
            onCancel={() => navigate("/courses")}
          />
        </form>
      </Card>
    </div>
  );
}
