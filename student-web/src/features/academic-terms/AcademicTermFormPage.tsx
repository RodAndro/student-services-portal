import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { academicTermsApi } from "../../api";
import { ACADEMIC_TERM_STATUSES, SEMESTERS } from "../../api/academicTerms.api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
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
  academicTermToForm,
  academicTermToPayload,
  emptyAcademicTermForm,
  validateAcademicTerm
} from "./academicTermRules";
import type { AcademicTermFormValues } from "./academicTermRules";

const SEMESTER_LABELS: Record<string, string> = {
  "1": "First semester",
  "2": "Second semester",
  "3": "Third semester / summer"
};

/** Create mode has no id; edit mode loads the record first, then renders the form. */
export function AcademicTermFormPage() {
  const { id } = useParams();
  const termId = id ? Number(id) : null;

  return termId === null ? (
    <AcademicTermForm termId={null} initial={emptyAcademicTermForm} />
  ) : (
    <AcademicTermFormLoader termId={termId} />
  );
}

function AcademicTermFormLoader({ termId }: { termId: number }) {
  const query = useApiQuery(() => academicTermsApi.getAcademicTerm(termId).then(unwrap), [termId]);

  return (
    <div className="mx-auto max-w-3xl">
      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        loadingFallback={<SkeletonBlock rows={5} />}
      >
        {(term) => <AcademicTermForm termId={termId} initial={academicTermToForm(term)} />}
      </DataState>
    </div>
  );
}

function AcademicTermForm({
  termId,
  initial
}: {
  termId: number | null;
  initial: AcademicTermFormValues;
}) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = termId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateAcademicTerm(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = academicTermToPayload(form.values);
      const result =
        termId === null
          ? await academicTermsApi.createAcademicTerm(payload)
          : await academicTermsApi.updateAcademicTerm(termId, payload);

      toast.show({ tone: "success", title: result.message });
      navigate(`/academic-terms/${result.data.id}`, { replace: true });
    } catch (caught: unknown) {
      const apiError = toApiError(caught);
      // A duplicate (academic_year + semester) arrives as 422 on academic_year.
      form.applyServerErrors(apiError.fieldErrors);
      setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-sm">
        <Link to="/academic-terms" className="text-blue-700 underline hover:text-blue-800">
          ← Back to academic terms
        </Link>
      </p>

      <PageHeader
        title={isEdit ? "Edit academic term" : "New academic term"}
        description={
          isEdit
            ? "Update the term details."
            : "Create an academic year and semester before scheduling offerings."
        }
      />

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The academic term could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              htmlFor="term-academic-year"
              label="Academic year"
              required
              error={form.errors.academic_year}
              hint="Maximum 20 characters (for example 2026-2027)."
            >
              <Input
                id="term-academic-year"
                value={form.values.academic_year}
                invalid={Boolean(form.errors.academic_year)}
                maxLength={20}
                onChange={(event) => form.setField("academic_year", event.target.value)}
              />
            </Field>

            <Field htmlFor="term-semester" label="Semester" required error={form.errors.semester}>
              <Select
                id="term-semester"
                value={form.values.semester}
                invalid={Boolean(form.errors.semester)}
                onChange={(event) => form.setField("semester", event.target.value)}
              >
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={String(semester)}>
                    {SEMESTER_LABELS[String(semester)] ?? `Semester ${semester}`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              htmlFor="term-start-date"
              label="Start date"
              required
              error={form.errors.start_date}
            >
              <Input
                id="term-start-date"
                type="date"
                value={form.values.start_date}
                invalid={Boolean(form.errors.start_date)}
                onChange={(event) => form.setField("start_date", event.target.value)}
              />
            </Field>

            <Field
              htmlFor="term-end-date"
              label="End date"
              required
              error={form.errors.end_date}
              hint="Must be after the start date."
            >
              <Input
                id="term-end-date"
                type="date"
                value={form.values.end_date}
                invalid={Boolean(form.errors.end_date)}
                onChange={(event) => form.setField("end_date", event.target.value)}
              />
            </Field>
          </div>

          <Field htmlFor="term-status" label="Status" required error={form.errors.status}>
            <Select
              id="term-status"
              value={form.values.status}
              invalid={Boolean(form.errors.status)}
              onChange={(event) =>
                form.setField("status", event.target.value as AcademicTermFormValues["status"])
              }
            >
              {ACADEMIC_TERM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </Select>
          </Field>

          <FormActions
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create academic term"}
            onCancel={() => navigate("/academic-terms")}
          />
        </form>
      </Card>
    </div>
  );
}
