import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { academicTermsApi } from "../../api";
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
import { formatDate, formatDateTime, humanizeStatus } from "../../lib/format";

export function AcademicTermDetailPage() {
  const { id } = useParams();
  const termId = Number(id);
  const { isRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canWrite = isRole("admin", "registrar");

  const query = useApiQuery(() => academicTermsApi.getAcademicTerm(termId).then(unwrap), [termId]);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await academicTermsApi.deleteAcademicTerm(termId);
      toast.show({ tone: "success", title: result.message });
      navigate("/academic-terms", { replace: true });
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
          to="/academic-terms"
          className="rounded font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          ← Back to academic terms
        </Link>
      </p>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        emptyTitle="Academic term not found"
      >
        {(term) => (
          <>
            <PageHeader
              title={`${term.academic_year} · Semester ${term.semester}`}
              description="Academic term details."
              actions={
                canWrite ? (
                  <>
                    <LinkButton to={`/academic-terms/${term.id}/edit`}>Edit</LinkButton>
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
                  label="Academic year"
                  value={<span className="font-mono">{term.academic_year}</span>}
                />
                <DescriptionItem label="Semester" value={term.semester} />
                <DescriptionItem label="Start date" value={formatDate(term.start_date)} />
                <DescriptionItem label="End date" value={formatDate(term.end_date)} />
                <DescriptionItem
                  label="Status"
                  value={
                    <Badge tone={statusTone(term.status)}>{humanizeStatus(term.status)}</Badge>
                  }
                />
                <DescriptionItem label="Created" value={formatDateTime(term.created_at)} />
                <DescriptionItem label="Last updated" value={formatDateTime(term.updated_at)} />
              </DescriptionList>
            </Card>

            <ConfirmDialog
              open={confirming}
              title="Delete academic term"
              message={
                <>
                  <p>
                    Delete <strong>{term.academic_year}</strong> semester {term.semester}? This
                    cannot be undone.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    The API refuses to delete a term that still has course offerings.
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
