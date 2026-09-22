import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { ToastProvider } from "../components/feedback/ToastProvider";
import { routes } from "../router";

/**
 * Mounts the REAL route table (exported from `router.tsx`) with a memory history, so
 * these assertions cover the actual paths, guards and page components - not a copy
 * that could drift from the application.
 */
const state = vi.hoisted(() => ({ role: "admin" as string }));

vi.mock("../api", () => {
  const paginated = () => {
    return Promise.resolve({
      success: true,
      message: "OK",
      data: [],
      meta: { current_page: 1, per_page: 15, total: 0, last_page: 1, from: null, to: null }
    });
  };

  const single = (data: unknown = {}) => Promise.resolve({ success: true, message: "OK", data });
  const removed = () => Promise.resolve({ success: true, message: "OK", data: null });

  const shared = {
    listPrograms: paginated,
    listCourses: paginated,
    listAcademicTerms: paginated,
    listStudents: paginated,
    listCourseOfferings: paginated,
    listEnrollments: paginated,
    listGrades: paginated,
    listStudentEnrollments: paginated,
    listStudentGrades: paginated,
    listCourseOfferingStudents: paginated,
    getProgram: () => single(),
    getCourse: () => single(),
    getAcademicTerm: () => single(),
    getStudent: () => single(),
    getCourseOffering: () => single(),
    getEnrollment: () => single(),
    getGrade: () => single(),
    getAcademicRecord: () => single({ student: {}, academic_record: [] }),
    createProgram: () => single(),
    updateProgram: () => single(),
    deleteProgram: removed,
    createCourse: () => single(),
    updateCourse: () => single(),
    deleteCourse: removed,
    createAcademicTerm: () => single(),
    updateAcademicTerm: () => single(),
    deleteAcademicTerm: removed,
    createStudent: () => single(),
    updateStudent: () => single(),
    deleteStudent: removed,
    createCourseOffering: () => single(),
    updateCourseOffering: () => single(),
    deleteCourseOffering: removed,
    createEnrollment: () => single(),
    updateEnrollment: () => single(),
    deleteEnrollment: removed,
    createGrade: () => single(),
    updateGrade: () => single()
  };

  return {
    programsApi: shared,
    coursesApi: shared,
    academicTermsApi: shared,
    studentsApi: shared,
    courseOfferingsApi: shared,
    enrollmentsApi: shared,
    gradesApi: shared,
    healthApi: {
      ping: () => single({ service: "API", version: "v1", time: new Date().toISOString() })
    },
    authApi: {
      me: () =>
        single({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: state.role,
          status: "ACTIVE"
        }),
      login: () => single({ token: "t", token_type: "Bearer", user: {} }),
      logout: removed
    }
  };
});

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return render(
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}

interface Case {
  path: string;
  role: string;
  /** Heading text expected on screen. */
  heading: string;
  why: string;
}

const CASES: Case[] = [
  { path: "/", role: "admin", heading: "Dashboard", why: "index route renders the dashboard" },
  { path: "/students", role: "admin", heading: "Students", why: "list route" },
  { path: "/students/new", role: "admin", heading: "New student", why: "static segment beats :id" },
  { path: "/students/12/edit", role: "admin", heading: "Edit student", why: "nested edit route" },
  {
    path: "/programs",
    role: "instructor",
    heading: "Programs",
    why: "instructors may read programs"
  },
  {
    path: "/course-offerings/new",
    role: "registrar",
    heading: "New course offering",
    why: "staff write route"
  },
  {
    path: "/grades",
    role: "instructor",
    heading: "Grades",
    why: "instructors may read their own grades"
  },
  { path: "/portal", role: "student", heading: "My profile", why: "student portal route" },
  {
    path: "/portal/academic-record",
    role: "student",
    heading: "My academic record",
    why: "portal record route"
  },
  { path: "/account", role: "registrar", heading: "My account", why: "available to every role" },
  {
    path: "/students",
    role: "student",
    heading: "You do not have access to this page",
    why: "403 for a student"
  },
  {
    path: "/students",
    role: "instructor",
    heading: "You do not have access to this page",
    why: "403 for an instructor"
  },
  {
    path: "/programs/new",
    role: "instructor",
    heading: "You do not have access to this page",
    why: "instructors cannot create programs"
  },
  {
    path: "/portal",
    role: "admin",
    heading: "You do not have access to this page",
    why: "portal is student-only"
  },
  {
    path: "/does-not-exist",
    role: "admin",
    heading: "Page not found",
    why: "unknown URL hits the wildcard route"
  },
  {
    path: "/403",
    role: "admin",
    heading: "You do not have access to this page",
    why: "explicit 403 route"
  }
];

describe("routing (real route table)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  for (const testCase of CASES) {
    it(`${testCase.role} at ${testCase.path} -> "${testCase.heading}" (${testCase.why})`, async () => {
      state.role = testCase.role;
      window.localStorage.setItem("sim.token", "1|stored-token");

      renderAt(testCase.path);

      expect(await screen.findByRole("heading", { name: testCase.heading })).toBeInTheDocument();
    });
  }

  it("sends an unauthenticated deep link to the login screen", async () => {
    state.role = "admin";
    // No stored token: the session cannot be restored.
    renderAt("/students/12/grades");

    expect(await screen.findByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
  });

  it("keeps the session across a remount (page refresh)", async () => {
    state.role = "admin";
    window.localStorage.setItem("sim.token", "1|stored-token");

    const first = renderAt("/students");
    expect(await screen.findByRole("heading", { name: "Students" })).toBeInTheDocument();
    first.unmount();

    // A refresh is a fresh mount with the stored token still present.
    renderAt("/students");
    expect(await screen.findByRole("heading", { name: "Students" })).toBeInTheDocument();
  });
});
