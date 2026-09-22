import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { makeProgram, makeStudent, makeUser } from "../../../test/fixtures";
import { envelope, failure, installMockApi, paginated } from "../../../test/mockApi";
import { renderApp, withStoredSession } from "../../../test/renderApp";
import type { Student } from "../../../types/api";

/**
 * Student list component test.
 *
 * The network is mocked; everything else is real - the api module builds the query
 * string, the hook debounces the search, the table renders, and the assertions check
 * the parameters that would have gone over the wire.
 */

const ADMIN = makeUser();

const PROGRAMS = [
  makeProgram(),
  makeProgram({ id: 3, code: "BSIT", name: "BS Information Technology" })
];

const SANTOS = makeStudent({ id: 12, student_number: "2026-00012" });

const CRUZ = makeStudent({
  id: 13,
  student_number: "2026-00013",
  first_name: "Juan",
  last_name: "Cruz",
  program_id: 3,
  program: makeProgram({ id: 3, code: "BSIT", name: "BS Information Technology" }),
  year_level: 3,
  status: "INACTIVE"
});

/** A backend that really filters, so the round trip is what gets tested. */
function filterRows(rows: Student[], params: Record<string, unknown>): Student[] {
  const search = String(params.search ?? "").toLowerCase();

  return rows.filter((row) => {
    if (search && !`${row.full_name} ${row.student_number}`.toLowerCase().includes(search)) {
      return false;
    }
    if (params.program_id && row.program_id !== Number(params.program_id)) {
      return false;
    }
    if (params.year_level && row.year_level !== Number(params.year_level)) {
      return false;
    }
    if (params.status && row.status !== params.status) {
      return false;
    }
    return true;
  });
}

/** GET /auth/me and GET /programs (the select options) are needed by this screen. */
function baseRoutes() {
  return [
    { method: "get" as const, path: "/auth/me", reply: () => ({ body: envelope(ADMIN) }) },
    { method: "get" as const, path: "/programs", reply: () => ({ body: paginated(PROGRAMS) }) }
  ];
}

function mountList(rows: Student[] = [SANTOS, CRUZ]) {
  const api = installMockApi([
    ...baseRoutes(),
    {
      method: "get",
      path: "/students",
      reply: (request) => {
        const matched = filterRows(rows, request.params);
        const perPage = Number(request.params.per_page ?? 15);
        const page = Number(request.params.page ?? 1);
        const total = matched.length;
        const start = (page - 1) * perPage;

        // A faithful paginator: page 2 really returns the next rows.
        return {
          body: paginated(matched.slice(start, start + perPage), {
            current_page: page,
            per_page: perPage,
            total,
            last_page: Math.max(1, Math.ceil(total / perPage)),
            from: total === 0 ? null : start + 1,
            to: Math.min(start + perPage, total)
          })
        };
      }
    }
  ]);

  withStoredSession();
  renderApp("/students");

  return api;
}

describe("student list (API-integrated)", () => {
  it("renders the records the API returned, with the default query it sends", async () => {
    const api = mountList();

    const table = await screen.findByRole("table");
    const grid = within(table);

    expect(grid.getByText("Maria Santos")).toBeInTheDocument();
    expect(grid.getByText("2026-00012")).toBeInTheDocument();
    expect(grid.getByText("BSCS")).toBeInTheDocument();
    expect(grid.getByText("Juan Cruz")).toBeInTheDocument();
    expect(grid.getByText("BSIT")).toBeInTheDocument();
    // Status is readable text, not just a colour.
    expect(grid.getByText("Active")).toBeInTheDocument();
    expect(grid.getByText("Inactive")).toBeInTheDocument();

    // The parameters the list itself defaults to.
    expect(api.last("get", "/students").params).toMatchObject({
      sort: "last_name",
      direction: "asc",
      page: 1,
      per_page: 15
    });
  });

  it("sends the typed search term and renders the filtered result", async () => {
    const user = userEvent.setup();
    const api = mountList();

    await screen.findByRole("table");
    await user.type(screen.getByLabelText("Search"), "cruz");

    // Debounced: the request goes out once the user pauses.
    await waitFor(() => expect(api.last("get", "/students").params.search).toBe("cruz"), {
      timeout: 2000
    });

    const table = within(await screen.findByRole("table"));
    expect(await table.findByText("Juan Cruz")).toBeInTheDocument();
    expect(table.queryByText("Maria Santos")).not.toBeInTheDocument();
  });

  it("sends the backend's own parameter names for the filters", async () => {
    const user = userEvent.setup();
    const api = mountList();

    await screen.findByRole("table");

    await user.selectOptions(screen.getByLabelText("Program"), "3");
    await waitFor(() => expect(api.last("get", "/students").params.program_id).toBe(3));

    await user.selectOptions(screen.getByLabelText("Year level"), "3");
    await waitFor(() => expect(api.last("get", "/students").params.year_level).toBe(3));

    await user.selectOptions(screen.getByLabelText("Status"), "INACTIVE");
    await waitFor(() => expect(api.last("get", "/students").params.status).toBe("INACTIVE"));

    // All three filters survive together (they live in the URL).
    expect(api.last("get", "/students").params).toMatchObject({
      program_id: 3,
      year_level: 3,
      status: "INACTIVE"
    });
  });

  it("flips the sort direction when the active column is clicked again", async () => {
    const user = userEvent.setup();
    const api = mountList();

    const table = await screen.findByRole("table");
    expect(api.last("get", "/students").params).toMatchObject({
      sort: "last_name",
      direction: "asc"
    });

    await user.click(within(table).getByRole("button", { name: /^Name/ }));

    await waitFor(() =>
      expect(api.last("get", "/students").params).toMatchObject({
        sort: "last_name",
        direction: "desc"
      })
    );
  });

  it("asks for the next page and shows that page's rows", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 40 }, (_, index) =>
      makeStudent({
        id: 100 + index,
        student_number: `2026-0${100 + index}`,
        first_name: "Student",
        last_name: `Number${String(index).padStart(2, "0")}`
      })
    );
    const api = mountList(many);

    const table = await screen.findByRole("table");
    expect(within(table).getByText("Student Number00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(api.last("get", "/students").params.page).toBe(2));
    // Re-queried on purpose: the table is replaced by the loading state while the
    // next page is in flight, so the earlier reference is stale.
    const pageTwo = within(await screen.findByRole("table"));
    expect(await pageTwo.findByText("Student Number15")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("shows the empty state when nothing matches and clears the filters on request", async () => {
    const user = userEvent.setup();
    const api = mountList();

    await screen.findByRole("table");
    await user.type(screen.getByLabelText("Search"), "nobody");

    expect(await screen.findByText("No students match your filters")).toBeInTheDocument();

    const clearButtons = await screen.findAllByRole("button", { name: "Clear filters" });
    await user.click(clearButtons[0]);

    await waitFor(() => expect(api.last("get", "/students").params.search).toBeUndefined());
    // Both representations (desktop table + mobile cards) come back.
    expect((await screen.findAllByText("Maria Santos")).length).toBeGreaterThan(0);
  });

  it("shows the API's error and re-requests when the user retries", async () => {
    const user = userEvent.setup();
    let attempt = 0;

    const api = installMockApi([
      ...baseRoutes(),
      {
        method: "get",
        path: "/students",
        reply: () => {
          attempt += 1;

          if (attempt === 1) {
            return { status: 500, body: failure("Server error.") };
          }

          return { body: paginated([SANTOS]) };
        }
      }
    ]);

    withStoredSession();
    renderApp("/students");

    expect(await screen.findByText("Server error")).toBeInTheDocument();
    expect(screen.getByText("Server error.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    const table = within(await screen.findByRole("table"));
    expect(await table.findByText("Maria Santos")).toBeInTheDocument();
    expect(api.all("get", "/students")).toHaveLength(2);
  });
});
