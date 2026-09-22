import { Link } from "react-router-dom";
import {
  academicTermsApi,
  courseOfferingsApi,
  coursesApi,
  enrollmentsApi,
  gradesApi,
  programsApi,
  studentsApi
} from "../../api";
import { unwrap } from "../../api/unwrap";
import { useAuth } from "../../auth/useAuth";
import { ResourceTable } from "../../components/data/ResourceTable";
import type { Column } from "../../components/data/ResourceTable";
import { StatCard } from "../../components/data/StatCard";
import { DataState } from "../../components/data/DataState";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { statusTone } from "../../components/ui/tones";
import { Card } from "../../components/ui/Card";
import { LinkButton } from "../../components/ui/LinkButton";
import { DEMO_STUDENT_ID } from "../../config/env";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useCount } from "../../hooks/useCount";
import { formatDate, formatGrade, humanizeStatus } from "../../lib/format";
import type { Enrollment, Grade } from "../../types/api";

/**
 * Role-aware dashboard.
 *
 * Every figure comes from `meta.total` of a real collection endpoint, requested with
 * `per_page=1` because only the pagination metadata is needed. The backend exposes no
 * statistics endpoint, so nothing here is estimated - and where a role cannot read a
 * collection, the dashboard simply does not show that figure instead of faking it.
 */
export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "student") {
    return <StudentDashboard />;
  }

  if (user?.role === "instructor") {
    return <InstructorDashboard />;
  }

  return <StaffDashboard />;
}

/* ------------------------------------------------------- administrator / registrar */

function StaffDashboard() {
  const { user } = useAuth();

  const programs = useCount(() => programsApi.listPrograms({ per_page: 1 }));
  const courses = useCount(() => coursesApi.listCourses({ per_page: 1 }));
  const terms = useCount(() => academicTermsApi.listAcademicTerms({ per_page: 1 }));
  const students = useCount(() => studentsApi.listStudents({ per_page: 1 }));
  const offerings = useCount(() => courseOfferingsApi.listCourseOfferings({ per_page: 1 }));
  const enrollments = useCount(() => enrollmentsApi.listEnrollments({ per_page: 1 }));
  const grades = useCount(() => gradesApi.listGrades({ per_page: 1 }));

  const recent = useApiQuery(
    () => enrollmentsApi.listEnrollments({ per_page: 5, sort: "id", direction: "desc" }),
    []
  );

  const columns: Column<Enrollment>[] = [
    {
      key: "student",
      header: "Student",
      render: (row) => row.student?.full_name ?? `Student #${row.student_id}`
    },
    {
      key: "offering",
      header: "Course offering",
      render: (row) =>
        row.course_offering
          ? `${row.course_offering.course?.course_code ?? "Course"} · ${row.course_offering.section}`
          : `Offering #${row.course_offering_id}`
    },
    { key: "date", header: "Enrolled", render: (row) => formatDate(row.enrollment_date) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={statusTone(row.status)}>{humanizeStatus(row.status)}</Badge>
    }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Header
        title="Dashboard"
        subtitle={`Signed in as ${user?.name ?? "user"} (${humanizeStatus(user?.role ?? "")}). Every figure is the total reported by the API.`}
      />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Records</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={students.total}
            loading={students.loading}
            errorMessage={students.error?.message}
            hint="GET /students"
          />
          <StatCard
            label="Programs"
            value={programs.total}
            loading={programs.loading}
            errorMessage={programs.error?.message}
            hint="GET /programs"
          />
          <StatCard
            label="Courses"
            value={courses.total}
            loading={courses.loading}
            errorMessage={courses.error?.message}
            hint="GET /courses"
          />
          <StatCard
            label="Academic terms"
            value={terms.total}
            loading={terms.loading}
            errorMessage={terms.error?.message}
            hint="GET /academic-terms"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Academic activity</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Course offerings"
            value={offerings.total}
            loading={offerings.loading}
            errorMessage={offerings.error?.message}
            hint="GET /course-offerings"
          />
          <StatCard
            label="Enrollments"
            value={enrollments.total}
            loading={enrollments.loading}
            errorMessage={enrollments.error?.message}
            hint="GET /enrollments"
          />
          <StatCard
            label="Grades recorded"
            value={grades.total}
            loading={grades.loading}
            errorMessage={grades.error?.message}
            hint="GET /grades"
          />
        </div>
      </section>

      <Card
        title="Most recent enrollments"
        description="Newest five, from GET /enrollments sorted by id descending."
        actions={<LinkButton to="/enrollments">All enrollments</LinkButton>}
      >
        <DataState
          loading={recent.loading}
          error={recent.error}
          data={recent.data}
          onRetry={recent.refetch}
          isEmpty={recent.data?.meta.total === 0}
          emptyTitle="No enrollments yet"
        >
          {(page) => (
            <ResourceTable
              columns={columns}
              rows={page.data}
              rowKey={(row) => row.id}
              actions={(row) => <LinkButton to={`/students/${row.student_id}`}>Student</LinkButton>}
            />
          )}
        </DataState>
      </Card>

      <QuickLinks
        links={[
          { to: "/students", label: "Manage students" },
          { to: "/enrollments", label: "Enroll a student" },
          { to: "/grades", label: "Record grades" },
          { to: "/course-offerings", label: "Schedule offerings" }
        ]}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- instructor */

function InstructorDashboard() {
  const { user } = useAuth();

  // The API scopes all three collections to the offerings this instructor teaches.
  const offerings = useCount(() => courseOfferingsApi.listCourseOfferings({ per_page: 1 }));
  const enrollments = useCount(() => enrollmentsApi.listEnrollments({ per_page: 1 }));
  const grades = useCount(() => gradesApi.listGrades({ per_page: 1 }));

  const recentGrades = useApiQuery(
    () => gradesApi.listGrades({ per_page: 5, sort: "id", direction: "desc" }),
    []
  );

  const columns: Column<Grade>[] = [
    {
      key: "student",
      header: "Student",
      render: (row) => row.enrollment?.student?.full_name ?? `Enrollment #${row.enrollment_id}`
    },
    {
      key: "course",
      header: "Course",
      render: (row) => row.enrollment?.course_offering?.course?.course_code ?? "—"
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
    <div className="mx-auto max-w-6xl space-y-6">
      <Header
        title={`Welcome, ${user?.name ?? "instructor"}`}
        subtitle="These figures cover your own course offerings only - the API scopes them for an instructor."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="My course offerings"
          value={offerings.total}
          loading={offerings.loading}
          errorMessage={offerings.error?.message}
          hint="GET /course-offerings (scoped)"
        />
        <StatCard
          label="Enrollments in my classes"
          value={enrollments.total}
          loading={enrollments.loading}
          errorMessage={enrollments.error?.message}
          hint="GET /enrollments (scoped)"
        />
        <StatCard
          label="Grades in my classes"
          value={grades.total}
          loading={grades.loading}
          errorMessage={grades.error?.message}
          hint="GET /grades (scoped)"
        />
      </div>

      <Card
        title="Recently recorded grades"
        description="Newest five grades in your offerings."
        actions={<LinkButton to="/grades">All grades</LinkButton>}
      >
        <DataState
          loading={recentGrades.loading}
          error={recentGrades.error}
          data={recentGrades.data}
          onRetry={recentGrades.refetch}
          isEmpty={recentGrades.data?.meta.total === 0}
          emptyTitle="No grades recorded yet"
          emptyDescription="Open one of your offerings and use Record grade for a student."
        >
          {(page) => (
            <ResourceTable
              columns={columns}
              rows={page.data}
              rowKey={(row) => row.id}
              actions={(row) => <LinkButton to={`/grades/${row.id}/edit`}>Edit</LinkButton>}
            />
          )}
        </DataState>
      </Card>

      <QuickLinks
        links={[
          { to: "/course-offerings", label: "My course offerings" },
          { to: "/enrollments", label: "Enrollments in my classes" },
          { to: "/grades", label: "Grade book" }
        ]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ student */

function StudentDashboard() {
  const { user } = useAuth();

  const profile = useApiQuery(() => studentsApi.getStudent(DEMO_STUDENT_ID).then(unwrap), []);
  const enrollments = useCount(() => studentsApi.listStudentEnrollments(DEMO_STUDENT_ID, 1, 1), []);
  const grades = useCount(() => studentsApi.listStudentGrades(DEMO_STUDENT_ID, 1, 1), []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Header
        title={`Welcome, ${user?.name ?? "student"}`}
        subtitle="Your own records. A student account is refused by every list endpoint, so only your data is requested."
      />

      {profile.error ? (
        <Alert tone="warning" title="Your student record could not be loaded">
          <p>{profile.error.message}</p>
          <p className="mt-2">
            The API has no "my profile" endpoint, so the id comes from{" "}
            <span className="font-mono">VITE_DEMO_STUDENT_ID</span> (currently {DEMO_STUDENT_ID}).
            It must be the student profile linked to your account.
          </p>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="My enrollments"
          value={enrollments.total}
          loading={enrollments.loading}
          errorMessage={enrollments.error?.message}
          hint="GET /students/{id}/enrollments"
        />
        <StatCard
          label="My grades"
          value={grades.total}
          loading={grades.loading}
          errorMessage={grades.error?.message}
          hint="GET /students/{id}/grades"
        />
        <StatCard
          label="Program"
          value={profile.data?.program ? profile.data.program.code : null}
          loading={profile.loading}
          errorMessage={profile.error ? "Unavailable" : null}
          hint={profile.data ? `Year level ${profile.data.year_level}` : "GET /students/{id}"}
        />
      </div>

      <QuickLinks
        links={[
          { to: "/portal", label: "My profile" },
          { to: "/portal/enrollments", label: "My enrollments" },
          { to: "/portal/grades", label: "My grades" },
          { to: "/portal/academic-record", label: "My academic record" }
        ]}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- shared */

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function QuickLinks({ links }: { links: Array<{ to: string; label: string }> }) {
  return (
    <Card title="Go to">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
