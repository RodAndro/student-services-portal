import { useState } from "react";
import { coursesApi } from "../../api";
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
import { humanizeStatus } from "../../lib/format";
import type { Course, CourseListParams } from "../../types/api";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" }
];

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

export function CourseListPage() {
  const { isRole } = useAuth();
  const toast = useToast();
  const canWrite = isRole("admin", "registrar");

  const query = useListQueryState({
    defaultSort: "course_title",
    defaultDirection: "asc",
    filterKeys: ["status"]
  });
  const status = query.filter("status");

  const list = useApiQuery(
    () =>
      coursesApi.listCourses({
        search: query.search || undefined,
        status: (status || undefined) as CourseListParams["status"],
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        per_page: query.perPage
      }),
    [query.search, status, query.sort, query.direction, query.page, query.perPage]
  );

  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await coursesApi.deleteCourse(pendingDelete.id);
      toast.show({ tone: "success", title: result.message });
      setPendingDelete(null);
      list.refetch();
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Course>[] = [
    {
      key: "course_code",
      header: "Code",
      sortable: true,
      render: (row) => <span className="font-mono">{row.course_code}</span>
    },
    { key: "course_title", header: "Title", sortable: true, render: (row) => row.course_title },
    { key: "units", header: "Units", sortable: true, render: (row) => row.units },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    }
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Courses"
        description="The course catalogue. Courses are offered per academic term."
        actions={
          canWrite ? (
            <LinkButton to="/courses/new" variant="primary">
              New course
            </LinkButton>
          ) : null
        }
      />

      <ListToolbar>
        <SearchInput
          value={query.search}
          onChange={query.setSearch}
          placeholder="Search code or title…"
        />
        <FilterSelect
          id="course-status"
          label="Status"
          value={status}
          onChange={(value) => query.setFilter("status", value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <div className="w-full sm:w-32">
          <label htmlFor="course-per-page" className="block text-xs font-medium text-slate-600">
            Per page
          </label>
          <select
            id="course-per-page"
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
          emptyTitle={query.hasFilters ? "No courses match your filters" : "No courses yet"}
          emptyDescription={
            query.hasFilters
              ? "Try a different search term, or clear the filters to see everything."
              : "Courses are the catalogue entries that get offered each term."
          }
          emptyAction={
            query.hasFilters ? (
              <Button variant="secondary" size="sm" onClick={query.clearAll}>
                Clear filters
              </Button>
            ) : canWrite ? (
              <LinkButton to="/courses/new" variant="primary">
                Create the first course
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
                      <LinkButton to={`/courses/${row.id}`}>View</LinkButton>
                      <LinkButton to={`/courses/${row.id}/edit`}>Edit</LinkButton>
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
                    <LinkButton to={`/courses/${row.id}`}>View</LinkButton>
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
        title="Delete course"
        message={
          <>
            <p>
              Delete <strong>{pendingDelete?.course_title}</strong> ({pendingDelete?.course_code})?
              This cannot be undone.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              The API refuses to delete a course that still has course offerings.
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
