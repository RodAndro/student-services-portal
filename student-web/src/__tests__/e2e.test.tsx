import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { makeLoginPayload, makeProgram, makeStudent, makeUser } from "../test/fixtures";
import { envelope, failure, installMockApi, paginated } from "../test/mockApi";
import { renderApp, storedToken, TOKEN_STORAGE_KEY } from "../test/renderApp";
import type { Student } from "../types/api";

/**
 * End-to-end flow through the real application: the exported route table, the real
 * auth provider, guards, pages, forms and toasts. Only the HTTP boundary is mocked,
 * so this is the closest thing to driving the browser that runs without one - and it
 * is the flow the laboratory demonstration performs by hand.
 *
 * Journey: visit a protected page signed out -> sign in -> search the student list ->
 * open a record -> delete it with confirmation -> sign out.
 */

const ADMIN = makeUser();

const PROGRAMS = [makeProgram()];

const SANTOS = makeStudent({ id: 12, student_number: "2026-00012" });

const CRUZ = makeStudent({
  id: 13,
  student_number: "2026-00013",
  first_name: "Juan",
  last_name: "Cruz",
  program_id: 3,
  program: makeProgram({ id: 3, code: "BSIT", name: "BS Information Technology" })
});

/**
 * A small stateful backend, so the flow is coherent: deleting a student really
 * removes it from the next listing.
 */
function createBackend(rows: Student[]) {
  let students = [...rows];

  return {
    routes: [
      {
        method: "post" as const,
        path: "/auth/login",
        reply: () => ({
          body: envelope(makeLoginPayload(ADMIN), "Login successful.")
        })
      },
      { method: "get" as const, path: "/auth/me", reply: () => ({ body: envelope(ADMIN) }) },
      {
        method: "post" as const,
        path: "/auth/logout",
        reply: () => ({ body: envelope(null, "Logout successful.") })
      },
      { method: "get" as const, path: "/programs", reply: () => ({ body: paginated(PROGRAMS) }) },
      {
        method: "get" as const,
        path: "/students",
        reply: (request: { params: Record<string, unknown> }) => {
          const search = String(request.params.search ?? "").toLowerCase();
          const matched = students.filter((row) =>
            `${row.full_name} ${row.student_number}`.toLowerCase().includes(search)
          );

          return {
            body: paginated(matched, { current_page: 1, per_page: 15, total: matched.length })
          };
        }
      },
      {
        method: "get" as const,
        path: "/students/:id",
        reply: (request: { path: string }) => {
          const id = Number(request.path.split("/").at(-1));
          const found = students.find((row) => row.id === id);

          return found
            ? { body: envelope(found) }
            : { status: 404, body: failure(`Student ${id} was not found.`) };
        }
      },
      {
        method: "delete" as const,
        path: "/students/:id",
        reply: (request: { path: string }) => {
          const id = Number(request.path.split("/").at(-1));
          students = students.filter((row) => row.id !== id);

          return { body: envelope(null, "Student deleted successfully.") };
        }
      }
    ]
  };
}

describe("end-to-end: sign in, work with a record, sign out", () => {
  it("walks the whole journey without console errors", async () => {
    const user = userEvent.setup();
    const backend = createBackend([SANTOS, CRUZ]);
    const api = installMockApi(backend.routes);

    // Any React warning or thrown render error in this journey fails the test:
    // src/test/setup.ts fails any test that writes to console.error.

    // 1. A protected URL while signed out goes to the sign-in screen.
    renderApp("/students");
    expect(await screen.findByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Students" })).not.toBeInTheDocument();

    // 2. Sign in with the real credentials form.
    await user.type(screen.getByLabelText(/Email/), "admin@example.com");
    await user.type(screen.getByLabelText(/Password/), "password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    // 3. Back to the page that was requested, with the session stored.
    expect(await screen.findByRole("heading", { name: "Students" })).toBeInTheDocument();
    expect(storedToken()).toBe("1|test-token");
    expect(api.last("post", "/auth/login").body).toEqual({
      email: "admin@example.com",
      password: "password"
    });
    // The list request carried the token the interceptor attached.
    await waitFor(() =>
      expect(api.last("get", "/students").authorization).toBe("Bearer 1|test-token")
    );

    const grid = within(await screen.findByRole("table"));
    expect(grid.getByText("Maria Santos")).toBeInTheDocument();
    expect(grid.getByText("Juan Cruz")).toBeInTheDocument();

    // 4. Search narrows the list through the API.
    await user.type(screen.getByLabelText("Search"), "cruz");
    await waitFor(() => expect(api.last("get", "/students").params.search).toBe("cruz"));

    // The table is unmounted while the search is in flight, so it is re-queried.
    const filtered = within(await screen.findByRole("table"));
    expect(await filtered.findByText("Juan Cruz")).toBeInTheDocument();
    expect(filtered.queryByText("Maria Santos")).not.toBeInTheDocument();

    // 5. Clearing the filters brings everyone back.
    await user.click((await screen.findAllByRole("button", { name: "Clear filters" }))[0]);
    await waitFor(() => expect(api.last("get", "/students").params.search).toBeUndefined());

    const restored = within(await screen.findByRole("table"));
    expect(await restored.findByText("Maria Santos")).toBeInTheDocument();

    // 6. Open the record.
    const santosRow = within(screen.getByRole("table"))
      .getAllByRole("row")
      .find((row) => within(row).queryByText("Maria Santos"));
    expect(santosRow).toBeDefined();
    await user.click(within(santosRow as HTMLElement).getByRole("link", { name: "View" }));

    expect(await screen.findByRole("heading", { name: "Maria Santos" })).toBeInTheDocument();
    await waitFor(() => expect(api.all("get", "/students/12")).toHaveLength(1));
    // The student number appears in the page header and in the profile card.
    expect(screen.getAllByText("2026-00012").length).toBeGreaterThan(0);

    // 7. Back to the list and delete the record, with confirmation.
    await user.click(screen.getByRole("link", { name: "Students" }));
    const listTable = within(await screen.findByRole("table"));
    const deleteRow = listTable
      .getAllByRole("row")
      .find((row) => within(row).queryByText("Maria Santos"));

    await user.click(within(deleteRow as HTMLElement).getByRole("button", { name: "Delete" }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(/Maria Santos/)).toBeInTheDocument();

    await user.click(dialog.getByRole("button", { name: "Delete" }));

    // The API's own confirmation message is what the user sees.
    expect(await screen.findByText("Student deleted successfully.")).toBeInTheDocument();
    await waitFor(() => expect(api.all("delete", "/students/12")).toHaveLength(1));

    // The list refetched and the row is gone.
    await waitFor(() =>
      expect(within(screen.getByRole("table")).queryByText("Maria Santos")).not.toBeInTheDocument()
    );
    expect(within(screen.getByRole("table")).getByText("Juan Cruz")).toBeInTheDocument();

    // 8. Sign out revokes the session and returns to the sign-in screen.
    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(await screen.findByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
    expect(api.all("post", "/auth/logout")).toHaveLength(1);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("shows the API's refusal inside the dialog and keeps the record", async () => {
    const user = userEvent.setup();
    const message = "Cannot delete this student because enrollments are attached to it.";

    const api = installMockApi([
      ...createBackend([SANTOS]).routes.filter(
        (route) => !(route.method === "delete" && route.path === "/students/:id")
      ),
      {
        method: "delete",
        path: "/students/:id",
        reply: () => ({ status: 409, body: failure(message) })
      }
    ]);

    const { router } = renderApp("/login");
    await user.type(await screen.findByLabelText(/Email/), "admin@example.com");
    await user.type(screen.getByLabelText(/Password/), "password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(router.state.location.pathname).not.toBe("/login");
    // Waits for the signed-in shell rather than for a location change.
    await user.click(await screen.findByRole("link", { name: "Students" }));

    const table = within(await screen.findByRole("table"));
    const row = table.getAllByRole("row").find((item) => within(item).queryByText("Maria Santos"));
    await user.click(within(row as HTMLElement).getByRole("button", { name: "Delete" }));

    const dialog = within(await screen.findByRole("dialog"));
    await user.click(dialog.getByRole("button", { name: "Delete" }));

    // The 409 is explained where the action was taken, and the dialog stays open.
    expect(await screen.findByText("This action was refused")).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(api.all("delete", "/students/12")).toHaveLength(1);

    // Cancel leaves the record alone.
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(screen.getByRole("table")).getByText("Maria Santos")).toBeInTheDocument();
  });
});
