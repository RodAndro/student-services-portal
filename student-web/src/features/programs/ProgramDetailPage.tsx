import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { programsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { useAuth } from "../../auth/useAuth";
import { ConfirmDialog } from "../../components/data/ConfirmDialog";
import { DataState } from "../../components/data/DataState";
import { DescriptionItem, DescriptionList } from "../../components/data/DescriptionList";
import { useToast } from "../../components/feedback/useToast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { formatDateTime, humanizeStatus, orDash } from "../../lib/format";

export function ProgramDetailPage() {
  const { id } = useParams();
  const programId = Number(id);
  const { isRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canWrite = isRole("admin", "registrar");

  const query = useApiQuery(() => programsApi.getProgram(programId).then(unwrap), [programId]);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await programsApi.deleteProgram(programId);
      toast.show({ tone: "success", title: result.message });
      navigate("/programs", { replace: true });
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm">
        <Link
          to="/programs"
          className="rounded font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          ← Back to programs
        </Link>
      </p>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        emptyTitle="Program not found"
      >
        {(program) => (
          <>
            <PageHeader
              title={program.name}
              description={`Program code ${program.code}`}
              actions={
                canWrite ? (
                  <>
                    <LinkButton to={`/programs/${program.id}/edit`}>Edit</LinkButton>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setDeleteError(null);
                        setConfirming(true);
                      }}
                    >
                      Delete
                    </Button>
                  </>
                ) : null
              }
            />

            <Card title="Details">
              <DescriptionList>
                <DescriptionItem
                  label="Code"
                  value={<span className="font-mono">{program.code}</span>}
                />
                <DescriptionItem
                  label="Status"
                  value={
                    <Badge tone={statusTone(program.status)}>
                      {humanizeStatus(program.status)}
                    </Badge>
                  }
                />
                <DescriptionItem label="Description" value={orDash(program.description)} />
                <DescriptionItem label="Created" value={formatDateTime(program.created_at)} />
                <DescriptionItem label="Last updated" value={formatDateTime(program.updated_at)} />
                <DescriptionItem
                  label="Record id"
                  value={<span className="font-mono">{program.id}</span>}
                />
              </DescriptionList>
            </Card>

            <ConfirmDialog
              open={confirming}
              title="Delete program"
              message={
                <>
                  <p>
                    Delete <strong>{program.name}</strong> ({program.code})? This cannot be undone.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    The API refuses to delete a program that still has students assigned to it.
                  </p>
                </>
              }
              submitting={deleting}
              error={deleteError}
              onConfirm={confirmDelete}
              onCancel={() => {
                setConfirming(false);
                setDeleteError(null);
              }}
            />
          </>
        )}
      </DataState>
    </div>
  );
}
