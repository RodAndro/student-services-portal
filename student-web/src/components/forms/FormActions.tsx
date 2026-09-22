import type { ReactNode } from "react";
import { Button } from "../ui/Button";

export interface FormActionsProps {
  submitting: boolean;
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
}

/** Submit + cancel pair, with the loading state on the submit button. */
export function FormActions({
  submitting,
  onCancel,
  submitLabel,
  cancelLabel = "Cancel"
}: FormActionsProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
        {cancelLabel}
      </Button>
    </div>
  );
}
