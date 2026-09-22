import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { ToastProvider } from "../components/feedback/ToastProvider";
import { routes } from "../router";

/**
 * Drives the real pages through each data state by controlling what the API layer
 * returns: a pending promise (slow backend), an empty page, a transport failure, a
 * 500, a response that is not the API envelope, and a 403.
 */
const control = vi.hoisted(() => ({ mode: "ok" as string, role: "admin" as string }));

vi.mock("../api", () => {
  const page = {
    success: true,
    message: "OK",
    data: [],
    meta: { current_page: 1, per_page: 15, total: 0, last_page: 1, from: null, to: null }
  };

  const notFoundish = { success: true, message: "OK", data: {} };

  /** Resolves or rejects according to `control.mode`. */
  const respond = (okData: unknown) => {
    switch (control.mode) {
      case "loading":
        // Never settles: the "slow backend" case.
        return new Promise(() => {});
      case "network":
        return Promise.reject({
          status: 0,
          message:
            "Cannot reach the API. Make sure the Laravel server is running (php artisan serve) on http://127.0.0.1:8000."
        });
      case "server-error":
        return Promise.reject({ status: 500, message: "Server error." });
      case "unexpected":
        return Promise.reject({
          status: 200,
          message: "The server returned a response that did not match the API format."
        });
      case "gateway":
        // What the Vite dev proxy returns while `php artisan serve` is stopped.
        return Promise.reject({
          status: 502,
          message:
            "Cannot reach the API. Make sure the Laravel server is running (php artisan serve) on http://127.0.0.1:8000. (The request returned HTTP 502 with no API response.)"
        });
      case "forbidden":
        return Promise.reject({ status: 403, message: "This action is unauthorized." });
      default:
        return Promise.resolve(okData);
    }
  };

  const list = () => respond({ ...page, success: true });
  const detail = (data: unknown = notFoundish) => respond(data);

  const shared = {
    listPrograms: list,
    listCourses: list,
    listAcademicTerms: list,
    listStudents: list,
    listCourseOfferings: list,
    listEnrollments: list,
    listGrades: list,
    listStudentEnrollments: list,
    listStudentGrades: list,
    listCourseOfferingStudents: list,
    getProgram: () => detail(),
    getCourse: () => detail(),
    getAcademicTerm: () => detail(),
    getStudent: () => detail(),
    getCourseOffering: () => detail(),
    getEnrollment: () => detail(),
    getGrade: () => detail(),
    getAcademicRecord: () => detail({ student: {}, academic_record: [] })
  };

  return {
    programsApi: shared,
    coursesApi: shared,
    academicTermsApi: shared,
    studentsApi: shared,
    courseOfferingsApi: shared,
    enrollmentsApi: shared,
    gradesApi: shared,
    healthApi: { ping: () => Promise.resolve({ success: true, message: "OK", data: {} }) },
    authApi: {
      me: () =>
        Promise.resolve({
          success: true,
          message: "OK",
          data: {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            role: control.role,
            status: "ACTIVE"
          }
        }),
      login: () => Promise.resolve({ success: true, message: "OK", data: {} }),
      logout: () => Promise.resolve({ success: true, message: "OK", data: null })
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

describe("data states", () => {
  beforeEach(() => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    vi.clearAllMocks();
    control.role = "admin";
  });

  it("shows a loading indicator while the request is in flight (slow backend)", async () => {
    control.mode = "loading";
    renderAt("/students");

    expect(await screen.findByLabelText("Loading content")).toBeInTheDocument();
    expect(screen.queryByText("No students yet")).not.toBeInTheDocument();
  });

  it("shows the empty state when the API returns no rows", async () => {
    control.mode = "ok";
    renderAt("/students");

    expect(await screen.findByText("No students yet")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading content")).not.toBeInTheDocument();
  });

  it("shows the network-error state with a retry when the API is unreachable", async () => {
    control.mode = "network";
    renderAt("/students");

    expect(await screen.findByText("Cannot reach the API")).toBeInTheDocument();
    expect(screen.getByText(/Make sure the Laravel server is running/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the server-error state for a 500", async () => {
    control.mode = "server-error";
    renderAt("/students");

    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(screen.getByText("Server error.")).toBeInTheDocument();
    expect(screen.getByText(/HTTP status 500/)).toBeInTheDocument();
  });

  it("reports an unexpected response instead of rendering undefined data", async () => {
    control.mode = "unexpected";
    renderAt("/students");

    expect(await screen.findByText(/did not match the API format/)).toBeInTheDocument();
  });

  it("tells the user the API is unreachable when a proxy answers 502", async () => {
    control.mode = "gateway";
    renderAt("/students");

    expect(await screen.findByText("Cannot reach the API")).toBeInTheDocument();
    expect(screen.getByText(/HTTP 502/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the forbidden message on a 403 action", async () => {
    control.mode = "forbidden";
    control.role = "student";
    renderAt("/portal");

    expect(await screen.findByText("This profile could not be loaded")).toBeInTheDocument();
    expect(screen.getByText("This action is unauthorized.")).toBeInTheDocument();
  });
});
