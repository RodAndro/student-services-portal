import { useState } from "react";
import { courseOfferingsApi } from "../../api";
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
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Button } from "../../components/ui/Button";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useListQueryState } from "../../hooks/useListQueryState";
import {
  useAcademicTermOptions,
  useCourseOptions,
  useInstructorOptions
} from "../../hooks/useReferenceOptions";
import { toApiError } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { humanizeStatus, orDash } from "../../lib/format";
import type { CourseOffering, CourseOfferingListParams } from "../../types/api";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" }
];

const PER_PAGE_OPTIONS = [10, 15, 25, 50];

/**
 * Course offering list - GET /course-offerings.
 *
 * Parameters: search (section, schedule, room), course_id, academic_term_id,
 * instructor_id, status, sort, direction, page, per_page.
 *
 * The server scopes an instructor to their own offerings, so the same page shows
 * everything for staff and only "my classes" for an instructor - which is stated
 * in a notice rather than silently looking like a filter the user set.
 */
export function CourseOfferingListPage() {
  const toast = useToast();
  const { isRole } = useAuth();
  const canWrite = isRole("admin", "registrar");
  const isInstructor = isRole("instructor");

  const courses = useCourseOptions();
  const terms = useAcademicTermOptions();
  const instructors = useInstructorOptions();

  const query = useListQueryState({
    defaultSort: "id",
    defaultDirection: "asc",
    filterKeys: ["course_id", "academic_term_id", "instructor_id", "status"]
  });
  const courseId = query.filter("course_id");
  const termId = query.filter("academic_term_id");
  const instructorId = query.filter("instructor_id");
  const status = query.filter("status");

  const list = useApiQuery(
    () =>
      courseOfferingsApi.listCourseOfferings({
        search: query.search || undefined,
        course_id: courseId ? Number(courseId) : undefined,
        academic_term_id: termId ? Number(termId) : undefined,
        instructor_id: instructorId ? Number(instructorId) : undefined,
        status: (status || undefined) as CourseOfferingListParams["status"],
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        per_page: query.perPage
      }),
    [
      query.search,
      courseId,
      termId,
      instructorId,
      status,
      query.sort,
      query.direction,
      query.page,
      query.perPage
    ]
  );

  const [pendingDelete, setPendingDelete] = useState<CourseOffering | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<ApiError | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await courseOfferingsApi.deleteCourseOffering(pendingDelete.id);
      toast.show({ tone: "success", title: result.message });
      setPendingDelete(null);
      list.refetch();
    } catch (caught: unknown) {
      setDeleteError(toApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<CourseOffering>[] = [
    {
      key: "course_id",
      header: "Course",
      render: (row) =>
        row.course ? (
          <div>
            <p className="font-medium text-slate-800">{row.course.course_code}</p>
            <p className="text-xs text-slate-500">{row.course.course_title}</p>
          </div>
        ) : (
          <span className="font-mono text-xs text-slate-500">Course #{row.course_id}</span>
        )
    },
    {
      key: "academic_term_id",
      header: "Term",
      render: (row) =>
        row.academic_term
          ? `${row.academic_term.academic_year} · Sem ${row.academic_term.semester}`
          : "—"
    },
    { key: "section", header: "Section", sortable: true, render: (row) => row.section },
    { key: "schedule", header: "Schedule", render: (row) => row.schedule },
    { key: "room", header: "Room", render: (row) => orDash(row.room) },
    {
      key: "instructor_id",
      header: "Instructor",
      render: (row) =>
        row.instructor ? (
          row.instructor.name
        ) : (
          <span className="font-mono text-xs">#{row.instructor_id}</span>
        )
    },
    {
      key: "capacity",
      header: "Enrolled / capacity",
      sortable: true,
      render: (row) => `${row.enrollments_count ?? 0} / ${row.capacity}`
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    }
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Course Offerings"
        description="A specific section of a course, in a term, taught by an instructor."
        actions={
          canWrite ? (
            <LinkButton to="/course-offerings/new" variant="primary">
              New course offering
            </LinkButton>
          ) : null
        }
      />

      {isInstructor ? (
        <div className="mb-4">
          <Alert tone="info" title="Showing your own offerings">
            <p>
              The API scopes an instructor to the offerings they teach, so this list only contains
              your classes. You can record grades for the students in them.
            </p>
          </Alert>
        </div>
      ) : null}

      <ListToolbar>
        <SearchInput
          value={query.search}
          onChange={query.setSearch}
          placeholder="Search section, schedule or room…"
        />

        <FilterSelect
          id="offering-course"
          label="Course"
          value={courseId}
          onChange={(value) => query.setFilter("course_id", value)}
          options={courses.options}
          placeholder="All courses"
        />

        <FilterSelect
          id="offering-term"
          label="Academic term"
          value={termId}
          onChange={(value) => query.setFilter("academic_term_id", value)}
          options={terms.options}
          placeholder="All terms"
        />

        <FilterSelect
          id="offering-instructor"
          label="Instructor"
          value={instructorId}
          onChange={(value) => query.setFilter("instructor_id", value)}
          options={instructors.options}
          placeholder="All instructors"
        />

        <FilterSelect
          id="offering-status"
          label="Status"
          value={status}
          onChange={(value) => query.setFilter("status", value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />

        <div className="w-full sm:w-32">
          <label htmlFor="offering-per-page" className="block text-xs font-medium text-slate-600">
            Per page
          </label>
          <select
            id="offering-per-page"
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
            query.hasFilters ? "No offerings match your filters" : "No course offerings yet"
          }
          emptyDescription={
            query.hasFilters
              ? "Try a different search term, or clear the filters to see everything."
              : "An offering schedules a course for a term with an instructor."
          }
          emptyAction={
            query.hasFilters ? (
              <Button variant="secondary" size="sm" onClick={query.clearAll}>
                Clear filters
              </Button>
            ) : canWrite ? (
              <LinkButton to="/course-offerings/new" variant="primary">
                Create the first offering
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
                      <LinkButton to={`/course-offerings/${row.id}`}>View</LinkButton>
                      <LinkButton to={`/course-offerings/${row.id}/edit`}>Edit</LinkButton>
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
                    <LinkButton to={`/course-offerings/${row.id}`}>View</LinkButton>
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
        title="Delete course offering"
        message={
          <>
            <p>
              Delete <strong>{pendingDelete?.course?.course_code ?? ""}</strong> section{" "}
              {pendingDelete?.section}? This cannot be undone.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              The API refuses to delete an offering that still has enrollments. Set its status to
              Inactive to close it without deleting the history.
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
