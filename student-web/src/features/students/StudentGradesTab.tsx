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
import { formatGrade } from "../../lib/format";
import type { Grade } from "../../types/api";

const PER_PAGE = 15;

/**
 * Grades of one student - GET /students/{id}/grades (page/per_page only).
 * Shared by the staff detail page and the student portal.
 */
export function StudentGradesTab({ studentId }: { studentId?: number }) {
  const params = useParams();
  const resolvedId = studentId ?? Number(params.id);

  const [page, setPage] = useState(1);

  const query = useApiQuery(
    () => studentsApi.listStudentGrades(resolvedId, page, PER_PAGE),
    [resolvedId, page]
  );

  const columns: Column<Grade>[] = [
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
          <span className="font-mono text-xs text-slate-500">Enrollment #{row.enrollment_id}</span>
        );
      }
    },
    { key: "midterm", header: "Midterm", render: (row) => formatGrade(row.midterm_grade) },
    { key: "final", header: "Final", render: (row) => formatGrade(row.final_grade) },
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => <Badge tone={statusTone(row.remarks)}>{row.remarks}</Badge>
    }
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Remarks are computed by the API from the final grade (75 is the passing mark).
      </p>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        isEmpty={query.data?.meta.total === 0}
        emptyTitle="No grades yet"
        emptyDescription="Grades are recorded per enrollment from the Grades screen."
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
