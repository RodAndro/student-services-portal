import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { courseOfferingsApi, enrollmentsApi, gradesApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
import { RemoteSelect } from "../../components/data/RemoteSelect";
import { useToast } from "../../components/feedback/useToast";
import { FormActions } from "../../components/forms/FormActions";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Card } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { useFormState } from "../../forms/useFormState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { toApiError } from "../../lib/errors";
import { GRADE_MAX, GRADE_MIN } from "../../api/grades.api";
import { emptyGradeForm, gradeToPayload, remarksPreview, validateGrade } from "./gradeRules";
import type { GradeFormValues } from "./gradeRules";

/**
 * Record or edit a grade.
 *
 * Create: an enrollment must be chosen, and since /enrollments has no search
 * parameter the choice is made in two steps - pick the course offering, then pick a
 * student from that offering's class list. Coming from the offering page
 * (`/grades/new?enrollment_id=…`) skips both steps.
 *
 * Edit: `PUT /grades/{id}`. There is no delete - a grade is corrected by editing.
 */
export function GradeFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const gradeId = id ? Number(id) : null;

  if (gradeId !== null) {
    return <GradeEditForm gradeId={gradeId} />;
  }

  return <GradeCreateForm prefilledEnrollmentId={searchParams.get("enrollment_id")} />;
}

/* ------------------------------------------------------------------ edit */

function GradeEditForm({ gradeId }: { gradeId: number }) {
  const query = useApiQuery(() => gradesApi.getGrade(gradeId).then(unwrap), [gradeId]);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-sm">
        <Link to="/grades" className="text-blue-700 underline hover:text-blue-800">
          ← Back to grades
        </Link>
      </p>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        loadingFallback={<SkeletonBlock rows={5} />}
        emptyTitle="Grade not found"
      >
        {(grade) => (
          <GradeForm
            gradeId={grade.id}
            enrollmentId={grade.enrollment_id}
            enrollmentLabel={
              grade.enrollment?.student
                ? `${grade.enrollment.student.student_number} — ${grade.enrollment.student.full_name}`
                : `Enrollment #${grade.enrollment_id}`
            }
            courseLabel={grade.enrollment?.course_offering?.course?.course_code ?? null}
            serverRemarks={grade.remarks}
            initial={{
              midterm_grade: grade.midterm_grade === null ? "" : String(grade.midterm_grade),
              final_grade: grade.final_grade === null ? "" : String(grade.final_grade)
            }}
          />
        )}
      </DataState>
    </div>
  );
}

/* ---------------------------------------------------------------- create */

function GradeCreateForm({ prefilledEnrollmentId }: { prefilledEnrollmentId: string | null }) {
  const hasPrefill = prefilledEnrollmentId !== null;

  const [offeringId, setOfferingId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState(prefilledEnrollmentId ?? "");

  // When arriving from the offering page, show which student is being graded.
  const enrollmentQuery = useApiQuery(
    () =>
      hasPrefill
        ? enrollmentsApi.getEnrollment(Number(prefilledEnrollmentId)).then(unwrap)
        : Promise.resolve(null),
    [prefilledEnrollmentId]
  );

  // One grade per enrollment: detect an existing one so the user is told instead of
  // hitting a 409 after filling the form.
  const existingQuery = useApiQuery(
    () =>
      hasPrefill
        ? gradesApi.listGrades({ enrollment_id: Number(prefilledEnrollmentId), per_page: 1 })
        : Promise.resolve(null),
    [prefilledEnrollmentId]
  );

  if (hasPrefill && (enrollmentQuery.loading || existingQuery.loading)) {
    return (
      <div className="mx-auto max-w-3xl">
        <SkeletonBlock rows={4} />
      </div>
    );
  }

  if (hasPrefill && enrollmentQuery.error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert tone="danger" title="Could not load the enrollment">
          <p>{enrollmentQuery.error.message}</p>
        </Alert>
      </div>
    );
  }

  const existingGrade = existingQuery.data?.data[0] ?? null;

  if (existingGrade) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Record grade" description="This enrollment already has a grade." />
        <Alert tone="warning" title="A grade already exists for this enrollment">
          <p>
            The API allows one grade per enrollment, so the existing one has to be edited instead of
            adding a second.
          </p>
        </Alert>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={`/grades/${existingGrade.id}/edit`}
            className="inline-flex min-h-11 items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit the existing grade
          </Link>
          <Link
            to="/grades"
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to grades
          </Link>
        </div>
      </div>
    );
  }

  const enrollment = enrollmentQuery.data;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-sm">
        <Link to="/grades" className="text-blue-700 underline hover:text-blue-800">
          ← Back to grades
        </Link>
      </p>

      <PageHeader
        title="Record grade"
        description="Grades are posted against an enrollment, which links a student to a course offering."
      />

      {!hasPrefill ? (
        <Card title="1. Choose the enrollment" className="mb-5">
          <div className="space-y-5">
            <RemoteSelect
              id="grade-offering"
              label="Course offering"
              value={offeringId}
              onChange={(value) => {
                setOfferingId(value);
                setEnrollmentId("");
              }}
              placeholder="Select a course offering…"
              searchPlaceholder="Search section, schedule or room…"
              loadOptions={(search) =>
                courseOfferingsApi
                  .listCourseOfferings({ search: search || undefined, per_page: 20 })
                  .then((page) =>
                    page.data.map((offering) => ({
                      value: String(offering.id),
                      label: `${offering.course?.course_code ?? `Course #${offering.course_id}`} · ${offering.section} · ${offering.schedule}`
                    }))
                  )
              }
            />

            <RemoteSelect
              key={offeringId}
              id="grade-enrollment"
              label="Student"
              value={enrollmentId}
              onChange={setEnrollmentId}
              placeholder={offeringId ? "Select a student…" : "Choose an offering first"}
              searchable={false}
              disabled={offeringId === ""}
              hint="The class list of the chosen offering (GET /course-offerings/{id}/students). It cannot be searched - that endpoint has no search parameter."
              loadOptions={(search) => {
                void search;

                if (offeringId === "") {
                  return Promise.resolve([]);
                }

                return courseOfferingsApi
                  .listCourseOfferingStudents(Number(offeringId), 1, 100)
                  .then((page) =>
                    page.data.map((row) => ({
                      value: String(row.id),
                      label: row.student
                        ? `${row.student.student_number} — ${row.student.full_name}`
                        : `Enrollment #${row.id}`
                    }))
                  );
              }}
            />
          </div>
        </Card>
      ) : null}

      <GradeForm
        gradeId={null}
        enrollmentId={Number(enrollmentId) || null}
        enrollmentLabel={
          enrollment?.student
            ? `${enrollment.student.student_number} — ${enrollment.student.full_name}`
            : enrollmentId === ""
              ? null
              : `Enrollment #${enrollmentId}`
        }
        courseLabel={enrollment?.course_offering?.course?.course_code ?? null}
        serverRemarks={null}
        initial={emptyGradeForm}
        stepLabel={hasPrefill ? undefined : "2. Enter the grades"}
      />
    </div>
  );
}

/* ------------------------------------------------------------ shared form */

function GradeForm({
  gradeId,
  enrollmentId,
  enrollmentLabel,
  courseLabel,
  serverRemarks,
  initial,
  stepLabel
}: {
  gradeId: number | null;
  enrollmentId: number | null;
  enrollmentLabel: string | null;
  courseLabel: string | null;
  serverRemarks: string | null;
  initial: GradeFormValues;
  stepLabel?: string;
}) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = gradeId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateGrade(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!isEdit && enrollmentId === null) {
      setFormError("Choose an enrollment before saving a grade.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = gradeToPayload(form.values);
      let message: string;

      if (gradeId === null) {
        if (enrollmentId === null) {
          setFormError("Choose an enrollment before saving a grade.");
          return;
        }

        const created = await gradesApi.createGrade({ enrollment_id: enrollmentId, ...payload });
        message = created.message;
      } else {
        const updated = await gradesApi.updateGrade(gradeId, payload);
        message = updated.message;
      }

      toast.show({ tone: "success", title: message });
      navigate("/grades", { replace: true });
    } catch (caught: unknown) {
      // 422 maps onto the fields; 409 means a grade appeared for the enrollment.
      const apiError = toApiError(caught);
      form.applyServerErrors(apiError.fieldErrors);
      setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title={stepLabel} description={stepLabel ? undefined : "Grade details"}>
      {enrollmentLabel ? (
        <p className="mb-4 text-sm text-slate-600">
          Grading <strong className="text-slate-800">{enrollmentLabel}</strong>
          {courseLabel ? <> · {courseLabel}</> : null}
        </p>
      ) : null}

      {serverRemarks ? (
        <div className="mb-4">
          <Alert tone="info" title={`Current remarks: ${serverRemarks}`}>
            <p>Remarks are recomputed by the API every time the grade is saved.</p>
          </Alert>
        </div>
      ) : null}

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The grade could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            htmlFor="grade-midterm"
            label="Midterm grade"
            error={form.errors.midterm_grade}
            hint={`Optional, ${GRADE_MIN}–${GRADE_MAX}.`}
          >
            <Input
              id="grade-midterm"
              type="number"
              min={GRADE_MIN}
              max={GRADE_MAX}
              step="0.01"
              value={form.values.midterm_grade}
              invalid={Boolean(form.errors.midterm_grade)}
              onChange={(event) => form.setField("midterm_grade", event.target.value)}
            />
          </Field>

          <Field
            htmlFor="grade-final"
            label="Final grade"
            error={form.errors.final_grade}
            hint={`Optional, ${GRADE_MIN}–${GRADE_MAX}. 75 or above passes.`}
          >
            <Input
              id="grade-final"
              type="number"
              min={GRADE_MIN}
              max={GRADE_MAX}
              step="0.01"
              value={form.values.final_grade}
              invalid={Boolean(form.errors.final_grade)}
              onChange={(event) => form.setField("final_grade", event.target.value)}
            />
          </Field>
        </div>

        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          The API will store this as <strong>{remarksPreview(form.values)}</strong>. The remark is
          computed server-side from the final grade (75 is the passing mark).
        </p>

        <FormActions
          submitting={submitting}
          submitLabel={isEdit ? "Save changes" : "Save grade"}
          onCancel={() => navigate("/grades")}
        />
      </form>
    </Card>
  );
}
