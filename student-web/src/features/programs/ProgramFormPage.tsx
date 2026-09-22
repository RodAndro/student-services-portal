import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { programsApi } from "../../api";
import { PROGRAM_STATUSES } from "../../api/programs.api";
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
import { emptyProgramForm, programToForm, programToPayload, validateProgram } from "./programRules";
import type { ProgramFormValues } from "./programRules";

/** Create mode has no id; edit mode loads the record first, then renders the form. */
export function ProgramFormPage() {
  const { id } = useParams();
  const programId = id ? Number(id) : null;

  return programId === null ? (
    <ProgramForm programId={null} initial={emptyProgramForm} />
  ) : (
    <ProgramFormLoader programId={programId} />
  );
}

function ProgramFormLoader({ programId }: { programId: number }) {
  const query = useApiQuery(() => programsApi.getProgram(programId).then(unwrap), [programId]);

  return (
    <div className="mx-auto max-w-3xl">
      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        loadingFallback={<SkeletonBlock rows={5} />}
      >
        {(program) => <ProgramForm programId={programId} initial={programToForm(program)} />}
      </DataState>
    </div>
  );
}

function ProgramForm({
  programId,
  initial
}: {
  programId: number | null;
  initial: ProgramFormValues;
}) {
  const form = useFormState(initial);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = programId !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateProgram(form.values);
    form.setErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = programToPayload(form.values);
      const result =
        programId === null
          ? await programsApi.createProgram(payload)
          : await programsApi.updateProgram(programId, payload);

      toast.show({ tone: "success", title: result.message });
      navigate(`/programs/${result.data.id}`, { replace: true });
    } catch (caught: unknown) {
      const apiError = toApiError(caught);
      // A duplicate code arrives as 422 with errors.code and lands under the field.
      form.applyServerErrors(apiError.fieldErrors);
      setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-sm">
        <Link to="/programs" className="text-blue-700 underline hover:text-blue-800">
          ← Back to programs
        </Link>
      </p>

      <PageHeader
        title={isEdit ? "Edit program" : "New program"}
        description={
          isEdit
            ? "Update the program's details."
            : "Create a program that students can be assigned to."
        }
      />

      {formError ? (
        <div className="mb-4">
          <Alert tone="danger" title="The program could not be saved">
            <p>{formError}</p>
          </Alert>
        </div>
      ) : null}

      <Card>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            htmlFor="program-code"
            label="Code"
            required
            error={form.errors.code}
            hint="Short unique code, maximum 20 characters (for example BSIT)."
          >
            <Input
              id="program-code"
              value={form.values.code}
              invalid={Boolean(form.errors.code)}
              maxLength={20}
              onChange={(event) => form.setField("code", event.target.value)}
            />
          </Field>

          <Field htmlFor="program-name" label="Name" required error={form.errors.name}>
            <Input
              id="program-name"
              value={form.values.name}
              invalid={Boolean(form.errors.name)}
              onChange={(event) => form.setField("name", event.target.value)}
            />
          </Field>

          <Field htmlFor="program-description" label="Description" error={form.errors.description}>
            <Textarea
              id="program-description"
              value={form.values.description}
              onChange={(event) => form.setField("description", event.target.value)}
            />
          </Field>

          <Field htmlFor="program-status" label="Status" required error={form.errors.status}>
            <Select
              id="program-status"
              value={form.values.status}
              invalid={Boolean(form.errors.status)}
              onChange={(event) =>
                form.setField("status", event.target.value as ProgramFormValues["status"])
              }
            >
              {PROGRAM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeStatus(status)}
                </option>
              ))}
            </Select>
          </Field>

          <FormActions
            submitting={submitting}
            submitLabel={isEdit ? "Save changes" : "Create program"}
            onCancel={() => navigate("/programs")}
          />
        </form>
      </Card>
    </div>
  );
}
