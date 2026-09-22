import { useState } from "react";
import { academicTermsApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import { ConfirmDialog } from "../../components/data/ConfirmDialog";
import { DataState } from "../../components/data/DataState";
import { FilterSelect, ListToolbar } from "../../components/data/ListToolbar";
import { Pagination } from "../../components/data/Pagination";
import { ResourceTable } from "../../components/data/ResourceTable";
import type { Column } from "../../components/data/ResourceTable";
import { SearchInput } from "../../components/data/SearchInput";
import { useToast } from "../../components/feedback/useToast";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useListQueryState } from "../../hooks/useListQueryState";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { formatDate, humanizeStatus } from "../../lib/format";
import type { AcademicTerm, AcademicTermListParams } from "../../types/api";

const SEMESTER_OPTIONS = [
  { value: "1", label: "First semester" },
  { value: "2", label: "Second semester" },
  { value: "3", label: "Third semester / summer" }
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "INACTIVE", label: "Inactive" }
];

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

export function AcademicTermListPage() {
  const { isRole } = useAuth();
  const toast = useToast();
  const canWrite = isRole("admin", "registrar");

  const query = useListQueryState({
    defaultSort: "academic_year",
    defaultDirection: "desc",
    filterKeys: ["semester", "status"]
  });
  const semester = query.filter("semester");
  const status = query.filter("status");

  const list = useApiQuery(
    () =>
      academicTermsApi.listAcademicTerms({
        search: query.search || undefined,
        semester: semester ? Number(semester) : undefined,
        status: (status || undefined) as AcademicTermListParams["status"],
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        per_page: query.perPage
      }),
    [query.search, semester, status, query.sort, query.direction, query.page, query.perPage]
  );

  const [pendingDelete, setPendingDelete] = useState<AcademicTerm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await academicTermsApi.deleteAcademicTerm(pendingDelete.id);
      toast.show({ tone: "success", title: result.message });
      setPendingDelete(null);
      list.refetch();
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<AcademicTerm>[] = [
    {
      key: "academic_year",
      header: "Academic year",
      sortable: true,
      render: (row) => <span className="font-mono">{row.academic_year}</span>
    },
    {
      key: "semester",
      header: "Semester",
      sortable: true,
      render: (row) => `Semester ${row.semester}`
    },
    {
      key: "start_date",
      header: "Starts",
      sortable: true,
      render: (row) => formatDate(row.start_date)
    },
    { key: "end_date", header: "Ends", render: (row) => formatDate(row.end_date) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    }
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Academic Terms"
        description="Academic years and semesters. Course offerings belong to a term."
        actions={
          canWrite ? (
            <LinkButton to="/academic-terms/new" variant="primary">
              New academic term
            </LinkButton>
          ) : null
        }
      />

      <ListToolbar>
        <SearchInput
          value={query.search}
          onChange={query.setSearch}
          placeholder="Search academic year…"
        />
        <FilterSelect
          id="term-semester"
          label="Semester"
          value={semester}
          onChange={(value) => query.setFilter("semester", value)}
          options={SEMESTER_OPTIONS}
          placeholder="All semesters"
        />
        <FilterSelect
          id="term-status"
          label="Status"
          value={status}
          onChange={(value) => query.setFilter("status", value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <div className="w-full sm:w-32">
          <label htmlFor="term-per-page" className="block text-xs font-medium text-slate-600">
            Per page
          </label>
          <select
            id="term-per-page"
            value={query.perPage}
            onChange={(event) => query.setPerPage(Number(event.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {query.hasFilters ? (
          <Button variant="ghost" size="sm" onClick={query.clearAll}>
            Clear filters
          </Button>
        ) : null}
      </ListToolbar>

      <div className="mt-5">
        <DataState
          loading={list.loading}
          error={list.error}
          data={list.data}
          onRetry={list.refetch}
          isEmpty={list.data?.meta.total === 0}
          emptyTitle={
            query.hasFilters ? "No academic terms match your filters" : "No academic terms yet"
          }
          emptyDescription={
            query.hasFilters
              ? "Try a different search term, or clear the filters to see everything."
              : "Create a term before scheduling course offerings."
          }
          emptyAction={
            query.hasFilters ? (
              <Button variant="secondary" size="sm" onClick={query.clearAll}>
                Clear filters
              </Button>
            ) : canWrite ? (
              <LinkButton to="/academic-terms/new" variant="primary">
                Create the first term
              </LinkButton>
            ) : null
          }
        >
          {(page) => (
            <div className="space-y-3">
              <ResourceTable
                columns={columns}
                rows={page.data}
                rowKey={(row) => row.id}
                sort={query.sort}
                direction={query.direction}
                onSortChange={query.toggleSort}
                actions={(row) =>
                  canWrite ? (
                    <>
                      <LinkButton to={`/academic-terms/${row.id}`}>View</LinkButton>
                      <LinkButton to={`/academic-terms/${row.id}/edit`}>Edit</LinkButton>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(row);
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <LinkButton to={`/academic-terms/${row.id}`}>View</LinkButton>
                  )
                }
              />

              <Pagination meta={page.meta} onPageChange={query.setPage} disabled={list.loading} />
            </div>
          )}
        </DataState>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete academic term"
        message={
          <>
            <p>
              Delete <strong>{pendingDelete?.academic_year}</strong> semester{" "}
              {pendingDelete?.semester}? This cannot be undone.
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
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
