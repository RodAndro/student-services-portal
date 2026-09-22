import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireRole } from "./auth/RequireRole";
import { AppLayout } from "./components/layout/AppLayout";
import { ALL_ROLES, ALL_STAFF, STAFF_AND_INSTRUCTOR } from "./components/layout/navigation";
import { AcademicTermDetailPage } from "./features/academic-terms/AcademicTermDetailPage";
import { AcademicTermFormPage } from "./features/academic-terms/AcademicTermFormPage";
import { AcademicTermListPage } from "./features/academic-terms/AcademicTermListPage";
import { LoginPage } from "./features/auth/LoginPage";
import { CourseOfferingDetailPage } from "./features/course-offerings/CourseOfferingDetailPage";
import { CourseOfferingFormPage } from "./features/course-offerings/CourseOfferingFormPage";
import { CourseOfferingListPage } from "./features/course-offerings/CourseOfferingListPage";
import { CourseDetailPage } from "./features/courses/CourseDetailPage";
import { CourseFormPage } from "./features/courses/CourseFormPage";
import { CourseListPage } from "./features/courses/CourseListPage";
import { EnrollmentFormPage } from "./features/enrollments/EnrollmentFormPage";
import { EnrollmentListPage } from "./features/enrollments/EnrollmentListPage";
import { GradeFormPage } from "./features/grades/GradeFormPage";
import { GradeListPage } from "./features/grades/GradeListPage";
import { AccountPage } from "./features/account/AccountPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { PortalAcademicRecordPage } from "./features/portal/PortalAcademicRecordPage";
import { PortalEnrollmentsPage } from "./features/portal/PortalEnrollmentsPage";
import { PortalGradesPage } from "./features/portal/PortalGradesPage";
import { PortalProfilePage } from "./features/portal/PortalProfilePage";
import { StudentAcademicRecordTab } from "./features/students/StudentAcademicRecordTab";
import { StudentDetailPage } from "./features/students/StudentDetailPage";
import { StudentEnrollmentsTab } from "./features/students/StudentEnrollmentsTab";
import { StudentFormPage } from "./features/students/StudentFormPage";
import { StudentGradesTab } from "./features/students/StudentGradesTab";
import { StudentListPage } from "./features/students/StudentListPage";
import { StudentProfileTab } from "./features/students/StudentProfileTab";
import { ProgramDetailPage } from "./features/programs/ProgramDetailPage";
import { ProgramFormPage } from "./features/programs/ProgramFormPage";
import { ProgramListPage } from "./features/programs/ProgramListPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ServerErrorPage } from "./pages/ServerErrorPage";

/**
 * Application routes.
 *
 * Everything except /login sits behind <RequireAuth>. Read routes allow the roles the
 * backend policy allows (instructors may read programs, courses and terms); write
 * routes are limited to admin/registrar, matching ProgramPolicy/CoursePolicy/
 * AcademicTermPolicy, which return false for instructors on create/update/delete.
 *
 * The table is exported separately from the browser router so tests can mount the
 * real routes with a memory history instead of a copy that could drift.
 */
export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <ServerErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },

      // Programs
      {
        path: "programs",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <ProgramListPage />
          </RequireRole>
        )
      },
      {
        path: "programs/new",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <ProgramFormPage />
          </RequireRole>
        )
      },
      {
        path: "programs/:id",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <ProgramDetailPage />
          </RequireRole>
        )
      },
      {
        path: "programs/:id/edit",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <ProgramFormPage />
          </RequireRole>
        )
      },

      // Courses
      {
        path: "courses",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <CourseListPage />
          </RequireRole>
        )
      },
      {
        path: "courses/new",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <CourseFormPage />
          </RequireRole>
        )
      },
      {
        path: "courses/:id",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <CourseDetailPage />
          </RequireRole>
        )
      },
      {
        path: "courses/:id/edit",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <CourseFormPage />
          </RequireRole>
        )
      },

      // Academic terms
      {
        path: "academic-terms",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <AcademicTermListPage />
          </RequireRole>
        )
      },
      {
        path: "academic-terms/new",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <AcademicTermFormPage />
          </RequireRole>
        )
      },
      {
        path: "academic-terms/:id",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <AcademicTermDetailPage />
          </RequireRole>
        )
      },
      {
        path: "academic-terms/:id/edit",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <AcademicTermFormPage />
          </RequireRole>
        )
      },

      // Students. The API refuses instructors entirely (StudentPolicy returns false
      // for every ability except staff), so the whole branch is staff-only.
      {
        path: "students",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <StudentListPage />
          </RequireRole>
        )
      },
      {
        path: "students/new",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <StudentFormPage />
          </RequireRole>
        )
      },
      {
        path: "students/:id",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <StudentDetailPage />
          </RequireRole>
        ),
        children: [
          { index: true, element: <StudentProfileTab /> },
          { path: "enrollments", element: <StudentEnrollmentsTab /> },
          { path: "grades", element: <StudentGradesTab /> },
          { path: "academic-record", element: <StudentAcademicRecordTab /> }
        ]
      },
      {
        path: "students/:id/edit",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <StudentFormPage />
          </RequireRole>
        )
      },

      // Course offerings. Instructors may read their own; only staff may write.
      {
        path: "course-offerings",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <CourseOfferingListPage />
          </RequireRole>
        )
      },
      {
        path: "course-offerings/new",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <CourseOfferingFormPage />
          </RequireRole>
        )
      },
      {
        path: "course-offerings/:id",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <CourseOfferingDetailPage />
          </RequireRole>
        )
      },
      {
        path: "course-offerings/:id/edit",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <CourseOfferingFormPage />
          </RequireRole>
        )
      },

      // Enrollments. Instructors may read enrollments in their own offerings only.
      {
        path: "enrollments",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <EnrollmentListPage />
          </RequireRole>
        )
      },
      {
        path: "enrollments/new",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <EnrollmentFormPage />
          </RequireRole>
        )
      },
      {
        path: "enrollments/:id/edit",
        element: (
          <RequireRole roles={ALL_STAFF}>
            <EnrollmentFormPage />
          </RequireRole>
        )
      },

      // Grades. Staff may grade anything; an instructor may record and update grades
      // for enrollments in the offerings they teach (EnrollmentPolicy::grade and
      // GradePolicy::update enforce it server-side).
      {
        path: "grades",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <GradeListPage />
          </RequireRole>
        )
      },
      {
        path: "grades/new",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <GradeFormPage />
          </RequireRole>
        )
      },
      {
        path: "grades/:id/edit",
        element: (
          <RequireRole roles={STAFF_AND_INSTRUCTOR}>
            <GradeFormPage />
          </RequireRole>
        )
      },

      // Student portal. A student is refused by every list endpoint, so these routes
      // are the only data screens a student role can reach.
      {
        path: "portal",
        element: (
          <RequireRole roles={["student"]}>
            <PortalProfilePage />
          </RequireRole>
        )
      },
      {
        path: "portal/enrollments",
        element: (
          <RequireRole roles={["student"]}>
            <PortalEnrollmentsPage />
          </RequireRole>
        )
      },
      {
        path: "portal/grades",
        element: (
          <RequireRole roles={["student"]}>
            <PortalGradesPage />
          </RequireRole>
        )
      },
      {
        path: "portal/academic-record",
        element: (
          <RequireRole roles={["student"]}>
            <PortalAcademicRecordPage />
          </RequireRole>
        )
      },

      // Available to every signed-in role: it only reads GET /auth/me.
      {
        path: "account",
        element: (
          <RequireRole roles={ALL_ROLES}>
            <AccountPage />
          </RequireRole>
        )
      },

      { path: "403", element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
];

export const router = createBrowserRouter(routes);
