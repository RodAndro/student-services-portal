import { useState } from "react";
import { useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import { DataState } from "../../components/data/DataState";
import { Pagination } from "../../components/data/Pagination";
import { ResourceTable } from "../../components/data/ResourceTable";
import type { Column } from "../../components/data/ResourceTable";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatDate, formatGrade, humanizeStatus } from "../../lib/format";
import type { Enrollment } from "../../types/api";

const PER_PAGE = 15;

/**
 * Enrollments of one student - GET /students/{id}/enrollments.
 *
 * That endpoint accepts only `page` and `per_page` (no search, sort or filters), so
 * pagination is local state and there are no other controls to offer.
 *
 * `studentId` is passed by the student portal; on the staff detail page it comes from
 * the route parameter.
 */
export function StudentEnrollmentsTab({ studentId }: { studentId?: number }) {
  const params = useParams();
  const resolvedId = studentId ?? Number(params.id);

  const [page, setPage] = useState(1);

  const query = useApiQuery(
    () => studentsApi.listStudentEnrollments(resolvedId, page, PER_PAGE),
    [resolvedId, page]
  );

  const columns: Column<Enrollment>[] = [
    {
      key: "course",
      header: "Course",
      render: (row) => {
        const course = row.course_offering?.course;
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
      key: "term",
      header: "Term",
      render: (row) => {
        const term = row.course_offering?.academic_term;
        return term ? `${term.academic_year} · Sem ${term.semester}` : "—";
      }
    },
    { key: "section", header: "Section", render: (row) => row.course_offering?.section ?? "—" },
    { key: "schedule", header: "Schedule", render: (row) => row.course_offering?.schedule ?? "—" },
    { key: "date", header: "Enrolled", render: (row) => formatDate(row.enrollment_date) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    },
    {
      key: "grade",
      header: "Final grade",
      render: (row) =>
        row.grade ? (
          <div>
            <p>{formatGrade(row.grade.final_grade)}</p>
            <p className="text-xs text-slate-500">{row.grade.remarks}</p>
          </div>
        ) : (
          <span className="text-slate-400">No grade yet</span>
        )
    }
  ];

  return (
    <div className="space-y-3">
      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        isEmpty={query.data?.meta.total === 0}
        emptyTitle="No enrollments"
        emptyDescription="Enrollments are created from the Enrollments screen."
      >
        {(result) => (
          <>
            <ResourceTable columns={columns} rows={result.data} rowKey={(row) => row.id} />
            <Pagination meta={result.meta} onPageChange={setPage} disabled={query.loading} />
          </>
        )}
      </DataState>
    </div>
  );
}
