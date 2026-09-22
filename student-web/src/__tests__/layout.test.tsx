import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { ToastProvider } from "../components/feedback/ToastProvider";
import { routes } from "../router";

vi.mock("../api", () => {
  const student = {
    id: 1,
    student_number: "2024-0001",
    first_name: "Ana",
    middle_name: null,
    last_name: "Cruz",
    full_name: "Ana Cruz",
    email: "ana@example.com",
    birth_date: "2004-01-01",
    year_level: 1,
    status: "ACTIVE",
    program_id: 1,
    program: { id: 1, code: "BSIT", name: "BS Information Technology", status: "ACTIVE" },
    created_at: "2026-01-01T00:00:00.000000Z",
    updated_at: "2026-01-01T00:00:00.000000Z"
  };

  // One row, so the list renders its real table (and the mobile card list).
  const page = {
    success: true,
    message: "OK",
    data: [student],
    meta: { current_page: 1, per_page: 15, total: 1, last_page: 1, from: 1, to: 1 }
  };

  const shared = {
    listPrograms: () => Promise.resolve(page),
    listCourses: () => Promise.resolve(page),
    listAcademicTerms: () => Promise.resolve(page),
    listStudents: () => Promise.resolve(page),
    listCourseOfferings: () => Promise.resolve(page),
    listEnrollments: () => Promise.resolve(page),
    listGrades: () => Promise.resolve(page),
    listStudentEnrollments: () => Promise.resolve(page),
    listStudentGrades: () => Promise.resolve(page),
    listCourseOfferingStudents: () => Promise.resolve(page)
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
            role: "admin",
            status: "ACTIVE"
          }
        }),
      login: () => Promise.resolve({ success: true, message: "OK", data: {} }),
      logout: () => Promise.resolve({ success: true, message: "OK", data: null })
    }
  };
});

function renderApp() {
  const router = createMemoryRouter(routes, { initialEntries: ["/students"] });

  return render(
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}

describe("application shell", () => {
  beforeEach(() => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    vi.clearAllMocks();
  });

  it("exposes semantic landmarks and a skip link", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Students" });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content"
    );
  });

  it("opens and closes the navigation drawer, including with Escape", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "Students" });

    // Closed to start with: only the opener is present.
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getAllByRole("button", { name: "Close navigation" }).length).toBeGreaterThan(0);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();
  });

  it("closes the drawer when a navigation link is chosen", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "Students" });

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.click(screen.getByRole("link", { name: "Dashboard" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();
  });

  it("groups navigation and marks the current page", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Students" });

    // Group headings come from the single navigation config.
    expect(screen.getByRole("heading", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Academic" })).toBeInTheDocument();

    const current = screen.getByRole("link", { name: "Students" });
    expect(current).toHaveAttribute("aria-current", "page");
  });

  /**
   * jsdom has no layout engine, so these assertions check the responsive classes the
   * layout depends on (drawer below `lg`, real table from `lg`). They are a structural
   * contract, not a visual check.
   */
  it("carries the responsive classes the layout depends on", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Students" });

    const opener = screen.getByRole("button", { name: "Open navigation" });
    expect(opener.className).toContain("lg:hidden");

    const sidebar = screen.getByRole("complementary", { name: "Sidebar" });
    expect(sidebar.className).toContain("hidden");
    expect(sidebar.className).toContain("lg:block");

    // Desktop table + mobile card list for the same rows.
    const table = await screen.findByRole("table");
    expect(table.parentElement?.className).toContain("lg:block");
    expect(table.parentElement?.className).toContain("hidden");
  });
});
