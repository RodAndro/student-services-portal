import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { ToastProvider } from "../components/feedback/ToastProvider";
import { routes } from "../router";

/**
 * Mounts the REAL application: the exported route table, the real auth provider and
 * the real toast provider, with a memory history instead of the browser's.
 *
 * Tests therefore walk the same paths, guards and pages the user does - nothing here
 * is a stand-in for the app.
 */
export function renderApp(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  return {
    router,
    ...render(
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    )
  };
}

export const TOKEN_STORAGE_KEY = "sim.token";

/** Puts a session in local storage before mount, exactly as a page refresh would. */
export function withStoredSession(token = "1|test-token"): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function storedToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}
