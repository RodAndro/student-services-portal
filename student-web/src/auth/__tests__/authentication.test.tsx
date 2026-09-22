import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "../../api";
import { AppLayout } from "../../components/layout/AppLayout";
import { LoginPage } from "../../features/auth/LoginPage";
import { NETWORK_ERROR_MESSAGE } from "../../lib/errors";
import type { ApiError } from "../../lib/errors";
import { http } from "../../lib/http";
import type { ApiSuccess, AuthUser } from "../../types/api";
import { AuthProvider } from "../AuthProvider";
import { RequireAuth } from "../RequireAuth";
import { RequireRole } from "../RequireRole";

// The API layer is mocked so these tests exercise the authentication UI and guards
// without a network. The running application always talks to the real API.
vi.mock("../../api", () => ({
  authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() }
}));

const loginMock = vi.mocked(authApi.login);
const meMock = vi.mocked(authApi.me);
const logoutMock = vi.mocked(authApi.logout);

/** Wraps a payload the way the real API does: `{ success, message, data }`. */
function envelope<T>(data: T, message = "OK"): ApiSuccess<T> {
  return { success: true, message, data };
}

const admin: AuthUser = {
  id: 1,
  name: "System Administrator",
  email: "admin@example.com",
  role: "admin",
  status: "ACTIVE"
};

const student: AuthUser = {
  id: 6,
  name: "Demo Student",
  email: "student@example.com",
  role: "student",
  status: "ACTIVE"
};

/** Mirrors the real router: /login public, everything else behind RequireAuth. */
function renderApp(initialPath = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<h2>Protected home</h2>} />
            <Route
              path="students"
              element={
                <RequireRole roles={["admin", "registrar"]}>
                  <h2>Students page</h2>
                </RequireRole>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

const signInButton = () => screen.findByRole("button", { name: /^sign in$/i });

describe("authentication", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("sends an unauthenticated visitor to the login page (protected route)", async () => {
    renderApp("/");

    expect(await signInButton()).toBeInTheDocument();
    expect(screen.queryByText("Protected home")).not.toBeInTheDocument();
  });

  it("validates the form client-side before calling the API", async () => {
    const user = userEvent.setup();
    renderApp("/login");

    await user.click(await signInButton());

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("signs in with valid credentials and reaches the protected page", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(
      envelope({ token: "1|valid-token", token_type: "Bearer", user: admin }, "Login successful.")
    );
    renderApp("/login");

    await user.type(await screen.findByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText("Protected home")).toBeInTheDocument();
    expect(loginMock).toHaveBeenCalledWith({ email: "admin@example.com", password: "password" });
    expect(window.localStorage.getItem("sim.token")).toBe("1|valid-token");
  });

  it("shows the API message and field error for invalid credentials", async () => {
    const user = userEvent.setup();
    const unauthorized: ApiError = {
      status: 422,
      message: "The provided credentials are incorrect.",
      fieldErrors: { email: ["The provided credentials are incorrect."] }
    };
    loginMock.mockRejectedValue(unauthorized);
    renderApp("/login");

    await user.type(await screen.findByLabelText(/email/i), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText("Sign-in failed")).toBeInTheDocument();
    expect(screen.getAllByText("The provided credentials are incorrect.").length).toBeGreaterThan(
      0
    );
    expect(window.localStorage.getItem("sim.token")).toBeNull();
    expect(screen.queryByText("Protected home")).not.toBeInTheDocument();
  });

  it("restores the session from a stored token (browser refresh)", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockResolvedValue(envelope(admin));

    renderApp("/");

    expect(await screen.findByText("Protected home")).toBeInTheDocument();
    expect(meMock).toHaveBeenCalledTimes(1);
  });

  it("clears an expired or invalid token and explains why", async () => {
    window.localStorage.setItem("sim.token", "1|stale-token");
    const unauthenticated: ApiError = { status: 401, message: "Unauthenticated." };
    meMock.mockRejectedValue(unauthenticated);

    renderApp("/");

    expect(await screen.findByText("Your session has ended")).toBeInTheDocument();
    expect(window.localStorage.getItem("sim.token")).toBeNull();
    expect(screen.queryByText("Protected home")).not.toBeInTheDocument();
  });

  it("signs out, revokes the session and returns to the login page", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockResolvedValue(envelope(admin));
    logoutMock.mockResolvedValue(envelope(null, "Logout successful."));

    renderApp("/");
    await screen.findByText("Protected home");

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(await signInButton()).toBeInTheDocument();
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("sim.token")).toBeNull();
  });

  it("shows the 403 page when the role may not use the page", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockResolvedValue(envelope(student));

    renderApp("/students");

    expect(await screen.findByText("You do not have access to this page")).toBeInTheDocument();
    expect(screen.queryByText("Students page")).not.toBeInTheDocument();
  });

  it("only shows navigation items the signed-in role may use", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockResolvedValue(envelope(student));

    renderApp("/");
    await screen.findByText("Protected home");

    expect(screen.getByRole("link", { name: "My Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Students" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Programs" })).not.toBeInTheDocument();
  });

  it("shows the staff navigation for an administrator", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockResolvedValue(envelope(admin));

    renderApp("/");
    await screen.findByText("Protected home");

    expect(screen.getByRole("link", { name: "Students" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Programs" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Profile" })).not.toBeInTheDocument();
  });

  it("clears the session when the account is refused at bootstrap (403)", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockRejectedValue({ status: 403, message: "This action is unauthorized." } as ApiError);

    renderApp("/");

    expect(await screen.findByText("Your session has ended")).toBeInTheDocument();
    expect(window.localStorage.getItem("sim.token")).toBeNull();
  });

  it("keeps the stored token when the API cannot be reached at bootstrap", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockRejectedValue({ status: 0, message: NETWORK_ERROR_MESSAGE } as ApiError);

    renderApp("/");

    // The user is not signed in, but the token survives so a reload can retry, and
    // this is not reported as an expired session.
    expect(await signInButton()).toBeInTheDocument();
    expect(window.localStorage.getItem("sim.token")).toBe("1|stored-token");
    expect(screen.queryByText("Your session has ended")).not.toBeInTheDocument();
  });

  it("ends the session when any request returns 401 mid-session", async () => {
    window.localStorage.setItem("sim.token", "1|stored-token");
    meMock.mockResolvedValue(envelope(admin));

    renderApp("/");
    await screen.findByText("Protected home");

    // The token is revoked server-side: the next request comes back 401. This goes
    // through the real axios instance, so it also covers the 401 interceptor hook.
    const originalAdapter = http.defaults.adapter;
    http.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
      const response = {
        status: 401,
        statusText: "",
        data: { success: false, message: "Unauthenticated." },
        headers: {},
        config
      } as AxiosResponse;

      throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response);
    }) as AxiosAdapter;

    try {
      await expect(http.get("/students")).rejects.toMatchObject({ status: 401 });

      expect(await screen.findByText("Your session has ended")).toBeInTheDocument();
      expect(window.localStorage.getItem("sim.token")).toBeNull();
      expect(screen.queryByText("Protected home")).not.toBeInTheDocument();
    } finally {
      http.defaults.adapter = originalAdapter;
    }
  });
});
