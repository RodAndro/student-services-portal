import type { ReactNode } from "react";
import type { ApiError } from "../../lib/errors";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body copy - usually explains what will be removed and what the API refuses. */
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting?: boolean;
  /** A 409 from the API (record still in use) is shown inside the dialog. */
  error?: ApiError | null;
}

/**
 * Confirmation step for destructive actions. Deleting is permanent in this API,
 * and while `submitting` is true both buttons are disabled - so a double click
 * cannot send two deletes.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  submitting = false,
  error = null
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={submitting}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-sm text-slate-700">{message}</div>

        {error ? (
          <Alert tone="danger" title="This action was refused">
            <p>{error.message}</p>
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
