import { gradesApi } from "../../api";
import { useAuth } from "../../auth/useAuth";
import { DataState } from "../../components/data/DataState";
import { Pagination } from "../../components/data/Pagination";
import { ResourceTable } from "../../components/data/ResourceTable";
import type { Column } from "../../components/data/ResourceTable";
import { PageHeader } from "../../components/layout/PageHeader";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { LinkButton } from "../../components/ui/LinkButton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useListQueryState } from "../../hooks/useListQueryState";
import { formatGrade } from "../../lib/format";
import type { Grade } from "../../types/api";

/**
 * Grade list - GET /grades.
 *
 * The controller only accepts `enrollment_id` as a filter (no `search`), so this
 * screen offers sorting and pagination. Instructors are scoped by the API to grades
 * belonging to their own offerings, which is stated in a notice.
 *
 * There is deliberately **no delete action**: GradeController has no destroy method
 * and the route is registered with `->except(['destroy'])`.
 */
export function GradeListPage() {
  const { isRole } = useAuth();
  const canCreate = isRole("admin", "registrar", "instructor");

  const query = useListQueryState({
    defaultSort: "id",
    defaultDirection: "desc",
    filterKeys: []
  });

  const list = useApiQuery(
    () =>
      gradesApi.listGrades({
        sort: query.sort,
        direction: query.direction,
        page: query.page,
        per_page: query.perPage
      }),
    [query.sort, query.direction, query.page, query.perPage]
  );

  const columns: Column<Grade>[] = [
    {
      key: "student",
      header: "Student",
      render: (row) =>
        row.enrollment?.student ? (
          <div>
            <p className="font-medium text-slate-800">{row.enrollment.student.full_name}</p>
            <p className="font-mono text-xs text-slate-500">
              {row.enrollment.student.student_number}
            </p>
          </div>
        ) : (
          <span className="font-mono text-xs text-slate-500">Enrollment #{row.enrollment_id}</span>
        )
    },
    {
      key: "course",
      header: "Course",
      render: (row) => {
        const course = row.enrollment?.course_offering?.course;
        return course ? (
          <div>
            <p className="font-medium text-slate-800">{course.course_code}</p>
            <p className="text-xs text-slate-500">{course.course_title}</p>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        );
      }
    },
    {
      key: "midterm_grade",
      header: "Midterm",
      sortable: true,
      render: (row) => formatGrade(row.midterm_grade)
    },
    {
      key: "final_grade",
      header: "Final",
      sortable: true,
      render: (row) => formatGrade(row.final_grade)
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => <Badge tone={statusTone(row.remarks)}>{row.remarks}</Badge>
    }
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Grades"
        description="Midterm and final grades. Remarks are computed by the API."
        actions={
          canCreate ? (
            <LinkButton to="/grades/new" variant="primary">
              Record grade
            </LinkButton>
          ) : null
        }
      />

      {isRole("instructor") ? (
        <div className="mb-4">
          <Alert tone="info" title="Showing grades for your offerings">
            <p>
              The API restricts an instructor to grades whose enrollment belongs to a course
              offering they teach.
            </p>
          </Alert>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-40">
          <label htmlFor="grade-per-page" className="block text-xs font-medium text-slate-600">
            Per page
          </label>
          <select
            id="grade-per-page"
            value={query.perPage}
            onChange={(event) => query.setPerPage(Number(event.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {[10, 15, 25, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Sort by clicking the <strong>Midterm</strong> or <strong>Final</strong> column.
        </p>
      </div>

      <div className="mt-5">
        <DataState
          loading={list.loading}
          error={list.error}
          data={list.data}
          onRetry={list.refetch}
          isEmpty={list.data?.meta.total === 0}
          emptyTitle="No grades recorded yet"
          emptyDescription="Record a grade for an enrollment, then it will appear here."
          emptyAction={
            canCreate ? (
              <LinkButton to="/grades/new" variant="primary">
                Record the first grade
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
                actions={(row) => (
                  <>
                    <LinkButton to={`/grades/${row.id}/edit`}>Edit</LinkButton>
                    {row.enrollment ? (
                      <LinkButton to={`/students/${row.enrollment.student_id}`}>Student</LinkButton>
                    ) : null}
                  </>
                )}
              />

              <Pagination meta={page.meta} onPageChange={query.setPage} disabled={list.loading} />
            </div>
          )}
        </DataState>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        A grade is corrected by editing it - the API exposes no delete endpoint for grades. Removing
        an enrollment (from the Enrollments screen) removes its grade with it.
      </p>
    </div>
  );
}
