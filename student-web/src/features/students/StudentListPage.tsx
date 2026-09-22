import { useState } from "react";
import { studentsApi } from "../../api";
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
import { useProgramOptions } from "../../hooks/useReferenceOptions";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { formatDate, humanizeStatus, orDash } from "../../lib/format";
import type { Student, StudentListParams } from "../../types/api";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" }
];

const YEAR_LEVEL_OPTIONS = [1, 2, 3, 4].map((year) => ({
  value: String(year),
  label: `Year ${year}`
}));

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

/**
 * Student list.
 *
 * Query parameters are exactly the ones StudentController accepts:
 * search, program_id, year_level, status, sort, direction, page, per_page.
 * A student or an instructor is refused by the API here (403) - the route guard
 * mirrors that, so this page is only reachable by admin/registrar.
 */
export function StudentListPage() {
  const toast = useToast();
  const programs = useProgramOptions();

  const query = useListQueryState({
    defaultSort: "last_name",
    defaultDirection: "asc",
    filterKeys: ["program_id", "year_level", "status"]
  });
  const programId = query.filter("program_id");
  const yearLevel = query.filter("year_level");
  const status = query.filter("status");

  const list = useApiQuery(
    () =>
      studentsApi.listStudents({
        search: query.search || undefined,
        program_id: programId ? Number(programId) : undefined,
        year_level: yearLevel ? Number(yearLevel) : undefined,
        status: (status || undefined) as StudentListParams["status"],
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        per_page: query.perPage
      }),
    [
      query.search,
      programId,
      yearLevel,
      status,
      query.sort,
      query.direction,
      query.page,
      query.perPage
    ]
  );

  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await studentsApi.deleteStudent(pendingDelete.id);
      toast.show({ tone: "success", title: result.message });
      setPendingDelete(null);
      list.refetch();
    } catch (caught: unknown) {
      // A 409 means the student still has enrollments - the reason is shown as-is.
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Student>[] = [
    {
      key: "student_number",
      header: "Student no.",
      sortable: true,
      render: (row) => <span className="font-mono">{row.student_number}</span>
    },
    {
      key: "last_name",
      header: "Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.full_name}</p>
          <p className="text-xs text-slate-500">{orDash(row.email)}</p>
        </div>
      )
    },
    {
      key: "program_id",
      header: "Program",
      render: (row) => row.program?.code ?? <span className="text-slate-400">—</span>
    },
    { key: "year_level", header: "Year", sortable: true, render: (row) => row.year_level },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    },
    {
      key: "birth_date",
      header: "Birth date",
      render: (row) => formatDate(row.birth_date)
    }
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        description="Student records, with their enrollments, grades and academic record."
        actions={
          <LinkButton to="/students/new" variant="primary">
            New student
          </LinkButton>
        }
      />

      <ListToolbar>
        <SearchInput
          value={query.search}
          onChange={query.setSearch}
          placeholder="Search name, number or email…"
        />

        <FilterSelect
          id="student-program"
          label="Program"
          value={programId}
          onChange={(value) => query.setFilter("program_id", value)}
          options={programs.options}
          placeholder={programs.loading ? "Loading programs…" : "All programs"}
        />

        <FilterSelect
          id="student-year"
          label="Year level"
          value={yearLevel}
          onChange={(value) => query.setFilter("year_level", value)}
          options={YEAR_LEVEL_OPTIONS}
          placeholder="All year levels"
        />

        <FilterSelect
          id="student-status"
          label="Status"
          value={status}
          onChange={(value) => query.setFilter("status", value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />

        <div className="w-full sm:w-32">
          <label htmlFor="student-per-page" className="block text-xs font-medium text-slate-600">
            Per page
          </label>
          <select
            id="student-per-page"
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
          emptyTitle={query.hasFilters ? "No students match your filters" : "No students yet"}
          emptyDescription={
            query.hasFilters
              ? "Try a different search term, or clear the filters to see everyone."
              : "Create a student record to get started. The seeder creates 100 for demonstration."
          }
          emptyAction={
            query.hasFilters ? (
              <Button variant="secondary" size="sm" onClick={query.clearAll}>
                Clear filters
              </Button>
            ) : (
              <LinkButton to="/students/new" variant="primary">
                Create the first student
              </LinkButton>
            )
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
                actions={(row) => (
                  <>
                    <LinkButton to={`/students/${row.id}`}>View</LinkButton>
                    <LinkButton to={`/students/${row.id}/edit`}>Edit</LinkButton>
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
                )}
              />

              <Pagination meta={page.meta} onPageChange={query.setPage} disabled={list.loading} />
            </div>
          )}
        </DataState>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete student"
        message={
          <>
            <p>
              Delete <strong>{pendingDelete?.full_name}</strong> ({pendingDelete?.student_number})?
              This cannot be undone.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              The API refuses to delete a student who still has enrollments. To keep the record and
              stop using it, set the status to Inactive instead.
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
