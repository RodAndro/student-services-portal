import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "../../api";
import { ALL_ROLES, ALL_STAFF, STAFF_AND_INSTRUCTOR } from "../../components/layout/navigation";
import { AppLayout } from "../../components/layout/AppLayout";
import type { ApiSuccess, AuthUser, UserRole } from "../../types/api";
import { AuthProvider } from "../AuthProvider";
import { RequireAuth } from "../RequireAuth";
import { RequireRole } from "../RequireRole";

vi.mock("../../api", () => ({
  authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() }
}));

const meMock = vi.mocked(authApi.me);

function envelope<T>(data: T): ApiSuccess<T> {
  return { success: true, message: "OK", data };
}

function userFor(role: UserRole): AuthUser {
  return { id: 1, name: `Test ${role}`, email: `${role}@example.com`, role, status: "ACTIVE" };
}

/**
 * The same path → role mapping the real router uses. If these lists ever drift from
 * `router.tsx`, this test fails, which is the point.
 */
const CASES: Array<{ path: string; label: string; allowed: UserRole[] }> = [
  { path: "programs", label: "Programs page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "programs/new", label: "New program page", allowed: ALL_STAFF },
  { path: "courses", label: "Courses page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "academic-terms", label: "Academic terms page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "students", label: "Students page", allowed: ALL_STAFF },
  { path: "course-offerings", label: "Course offerings page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "course-offerings/new", label: "New offering page", allowed: ALL_STAFF },
  { path: "enrollments", label: "Enrollments page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "grades", label: "Grades page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "grades/new", label: "Grade form page", allowed: STAFF_AND_INSTRUCTOR },
  { path: "portal", label: "Portal page", allowed: ["student"] },
  { path: "portal/grades", label: "Portal grades page", allowed: ["student"] },
  { path: "account", label: "Account page", allowed: ALL_ROLES }
];

const FORBIDDEN_TEXT = "You do not have access to this page";

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/${path}`]}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<h2>Dashboard page</h2>} />
            {CASES.map((testCase) => (
              <Route
                key={testCase.path}
                path={testCase.path}
                element={
                  <RequireRole roles={testCase.allowed}>
                    <h2>{testCase.label}</h2>
                  </RequireRole>
                }
              />
            ))}
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("role-aware route guards (direct URL access)", () => {
  beforeEach(() => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    vi.clearAllMocks();
  });

  for (const role of ALL_ROLES) {
    describe(`signed in as ${role}`, () => {
      beforeEach(() => {
        meMock.mockResolvedValue(envelope(userFor(role)));
      });

      for (const testCase of CASES) {
        const shouldAllow = testCase.allowed.includes(role);

        it(`${shouldAllow ? "allows" : "refuses"} direct access to /${testCase.path}`, async () => {
          renderAt(testCase.path);

          if (shouldAllow) {
            expect(await screen.findByText(testCase.label)).toBeInTheDocument();
            expect(screen.queryByText(FORBIDDEN_TEXT)).not.toBeInTheDocument();
          } else {
            expect(await screen.findByText(FORBIDDEN_TEXT)).toBeInTheDocument();
            expect(screen.queryByText(testCase.label)).not.toBeInTheDocument();
          }
        });
      }
    });
  }
});

describe("role-aware navigation", () => {
  beforeEach(() => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    vi.clearAllMocks();
  });

  it("shows only student links to a student", async () => {
    meMock.mockResolvedValue(envelope(userFor("student")));
    renderAt("account");

    await screen.findByText("Account page");

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Profile" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Academic Record" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Account" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Students" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Programs" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Grades" })).not.toBeInTheDocument();
  });

  it("shows reference data but no student management to an instructor", async () => {
    meMock.mockResolvedValue(envelope(userFor("instructor")));
    renderAt("account");

    await screen.findByText("Account page");

    expect(screen.getByRole("link", { name: "Programs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Course Offerings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grades" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Students" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Profile" })).not.toBeInTheDocument();
  });

  it("shows everything to an administrator", async () => {
    meMock.mockResolvedValue(envelope(userFor("admin")));
    renderAt("account");

    await screen.findByText("Account page");

    for (const label of [
      "Dashboard",
      "Programs",
      "Courses",
      "Academic Terms",
      "Students",
      "Course Offerings",
      "Enrollments",
      "Grades",
      "My Account"
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }

    expect(screen.queryByRole("link", { name: "My Profile" })).not.toBeInTheDocument();
  });
});
