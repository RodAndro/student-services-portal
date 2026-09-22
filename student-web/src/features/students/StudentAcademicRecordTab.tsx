import { useParams } from "react-router-dom";
import { studentsApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { statusTone } from "../../components/ui/tones";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatDate, formatGrade, humanizeStatus } from "../../lib/format";

/**
 * Academic record - GET /students/{id}/academic-record.
 *
 * The endpoint is NOT paginated: it returns every term the student has activity in,
 * already grouped by the API and sorted newest-first. The screen renders exactly that
 * shape and adds no academic maths of its own - no GPA, no averages, no totals, because
 * the API does not provide them.
 *
 * `studentId` is passed by the student portal; on the staff detail page it comes from
 * the route parameter.
 */
export function StudentAcademicRecordTab({ studentId }: { studentId?: number }) {
  const params = useParams();
  const resolvedId = studentId ?? Number(params.id);

  const query = useApiQuery(
    () => studentsApi.getAcademicRecord(resolvedId).then(unwrap),
    [resolvedId]
  );

  return (
    <DataState
      loading={query.loading}
      error={query.error}
      data={query.data}
      onRetry={query.refetch}
      isEmpty={query.data?.academic_record.length === 0}
      emptyTitle="No academic record yet"
      emptyDescription="This student has no enrollments, so there is nothing to group by term."
    >
      {(record) => (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {record.student.full_name}{" "}
              <span className="font-mono text-xs text-slate-500">
                {record.student.student_number}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Grouped by academic term, newest first, exactly as the API returns it. Remarks come
              from the server (75 is the passing mark).
            </p>
          </div>

          {record.academic_record.map((term) => (
            <Card
              key={term.academic_term.id}
              title={`${term.academic_term.academic_year} · Semester ${term.academic_term.semester}`}
              description={`${term.enrollments.length} course${
                term.enrollments.length === 1 ? "" : "s"
              } · ${formatDate(term.academic_term.start_date)} to ${formatDate(
                term.academic_term.end_date
              )}`}
              actions={
                <Badge tone={statusTone(term.academic_term.status)}>
                  {humanizeStatus(term.academic_term.status)}
                </Badge>
              }
            >
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-2 pr-4">
                        Course
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Section
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Schedule
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Enrollment
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Midterm
                      </th>
                      <th scope="col" className="py-2 pr-4">
                        Final
                      </th>
                      <th scope="col" className="py-2">
                        Remarks
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {term.enrollments.map((entry) => (
                      <tr key={entry.enrollment_id}>
                        <td className="py-2 pr-4">
                          <p className="font-medium text-slate-800">{entry.course.course_code}</p>
                          <p className="text-xs text-slate-500">{entry.course.course_title}</p>
                        </td>
                        <td className="py-2 pr-4">{entry.section}</td>
                        <td className="py-2 pr-4">{entry.schedule}</td>
                        <td className="py-2 pr-4">{humanizeStatus(entry.status)}</td>
                        <td className="py-2 pr-4">{formatGrade(entry.grade?.midterm_grade)}</td>
                        <td className="py-2 pr-4">{formatGrade(entry.grade?.final_grade)}</td>
                        <td className="py-2">
                          {entry.grade ? (
                            <Badge tone={statusTone(entry.grade.remarks)}>
                              {entry.grade.remarks}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">No grade yet</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {term.enrollments.map((entry) => (
                  <li
                    key={entry.enrollment_id}
                    className="rounded-md border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">{entry.course.course_code}</p>
                        <p className="text-xs text-slate-500">{entry.course.course_title}</p>
                      </div>
                      {entry.grade ? (
                        <Badge tone={statusTone(entry.grade.remarks)}>{entry.grade.remarks}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">No grade yet</span>
                      )}
                    </div>

                    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-slate-500">Section</dt>
                        <dd className="text-slate-800">{entry.section}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Schedule</dt>
                        <dd className="text-slate-800">{entry.schedule}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Midterm</dt>
                        <dd className="text-slate-800">
                          {formatGrade(entry.grade?.midterm_grade)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Final</dt>
                        <dd className="text-slate-800">{formatGrade(entry.grade?.final_grade)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </DataState>
  );
}
