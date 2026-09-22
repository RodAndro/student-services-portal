import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { makeProgram, makeStudent, makeUser } from "../../../test/fixtures";
import { envelope, failure, installMockApi, paginated } from "../../../test/mockApi";
import { renderApp, withStoredSession } from "../../../test/renderApp";
import type { Student } from "../../../types/api";

/**
 * Student form test: client-side validation, the server's 422, the payload that is
 * actually sent, and duplicate-submission protection.
 *
 * Only the network is mocked. The rules in `studentRules.ts`, the form state hook and
 * the field components all run for real, so these assertions describe behaviour a user
 * would see.
 */

const ADMIN = makeUser();
const PROGRAMS = [
  makeProgram(),
  makeProgram({ id: 3, code: "BSIT", name: "BS Information Technology" })
];

const SAVED = makeStudent({ id: 77, student_number: "2026-09999" });

function baseRoutes() {
  return [
    { method: "get" as const, path: "/auth/me", reply: () => ({ body: envelope(ADMIN) }) },
    { method: "get" as const, path: "/programs", reply: () => ({ body: paginated(PROGRAMS) }) }
  ];
}

/** The three fields the form insists on (plus a program). */
async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Student number/), "2026-09999");
  await user.type(screen.getByLabelText(/First name/), "Ana");
  await user.type(screen.getByLabelText(/Last name/), "Reyes");
  await user.selectOptions(screen.getByLabelText(/Program/), "2");
}

async function openCreateForm() {
  withStoredSession();
  renderApp("/students/new");
  await screen.findByRole("heading", { name: "New student" });
}

/** Date inputs are set directly: typing into them character-by-character is not a
 *  realistic interaction and jsdom's date widget does not support it. */
function setDate(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("student form", () => {
  it("blocks submission and names every missing required field", async () => {
    const user = userEvent.setup();
    const api = installMockApi(baseRoutes());

    await openCreateForm();
    await user.click(screen.getByRole("button", { name: "Create student" }));

    expect(await screen.findByText("Student number is required.")).toBeInTheDocument();
    expect(screen.getByText("First name is required.")).toBeInTheDocument();
    expect(screen.getByText("Last name is required.")).toBeInTheDocument();
    expect(screen.getByText("Program is required.")).toBeInTheDocument();

    // Nothing was sent: invalid input never reaches the API.
    expect(api.all("post", "/students")).toHaveLength(0);
    // The failing controls are marked for assistive technology.
    expect(screen.getByLabelText(/Student number/)).toHaveAttribute("aria-invalid", "true");
  });

  it("rejects a birth date that is not in the past", async () => {
    const user = userEvent.setup();
    const api = installMockApi(baseRoutes());

    await openCreateForm();
    await fillRequired(user);
    setDate(/Birth date/, "2099-01-01");
    await user.click(screen.getByRole("button", { name: "Create student" }));

    expect(await screen.findByText("Birth date must be before today.")).toBeInTheDocument();
    expect(api.all("post", "/students")).toHaveLength(0);
  });

  it("rejects a malformed email address", async () => {
    const user = userEvent.setup();
    const api = installMockApi(baseRoutes());

    await openCreateForm();
    await fillRequired(user);
    await user.type(screen.getByLabelText(/Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Create student" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(api.all("post", "/students")).toHaveLength(0);
  });

  it("clears a field's error as soon as the user corrects it", async () => {
    const user = userEvent.setup();
    installMockApi(baseRoutes());

    await openCreateForm();
    await user.click(screen.getByRole("button", { name: "Create student" }));
    expect(await screen.findByText("First name is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/First name/), "Ana");

    expect(screen.queryByText("First name is required.")).not.toBeInTheDocument();
  });

  it("sends the exact payload the API expects for a valid student", async () => {
    const user = userEvent.setup();
    const api = installMockApi([
      ...baseRoutes(),
      {
        method: "post",
        path: "/students",
        reply: () => ({ status: 201, body: envelope(SAVED, "Student created successfully.") })
      },
      { method: "get", path: "/students/:id", reply: () => ({ body: envelope(SAVED) }) }
    ]);

    await openCreateForm();
    await fillRequired(user);
    setDate(/Birth date/, "2005-03-04");
    await user.selectOptions(screen.getByLabelText(/Year level/), "3");
    await user.click(screen.getByRole("button", { name: "Create student" }));

    await waitFor(() => expect(api.all("post", "/students")).toHaveLength(1));

    // Trimmed strings, untouched optionals as null, numbers as numbers - what
    // StoreStudentRequest validates.
    expect(api.last("post", "/students").body).toEqual({
      student_number: "2026-09999",
      first_name: "Ana",
      middle_name: null,
      last_name: "Reyes",
      suffix: null,
      birth_date: "2005-03-04",
      email: null,
      contact_number: null,
      address: null,
      program_id: 2,
      year_level: 3,
      status: "ACTIVE"
    });

    // The stored session token travels with the write.
    expect(api.last("post", "/students").authorization).toBe("Bearer 1|test-token");

    // On success the app follows the id the API returned.
    await waitFor(() => expect(api.all("get", "/students/77")).toHaveLength(1));
  });

  it("shows the API's 422 on the field it belongs to and stays on the form", async () => {
    const user = userEvent.setup();
    const message = "The student number has already been taken.";
    const api = installMockApi([
      ...baseRoutes(),
      {
        method: "post",
        path: "/students",
        reply: () => ({
          status: 422,
          body: failure(message, { student_number: [message] })
        })
      }
    ]);

    await openCreateForm();
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Create student" }));

    // The API's own wording, shown at the top of the form and against the field.
    expect(await screen.findByText("The student could not be saved")).toBeInTheDocument();
    expect(screen.getAllByText(message).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText(/Student number/)).toHaveAttribute("aria-invalid", "true");

    // Not navigated away, and the form is usable again.
    expect(screen.getByRole("heading", { name: "New student" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create student" })).toBeEnabled();
    expect(api.all("post", "/students")).toHaveLength(1);
  });

  it("does not send a second request while the first is still in flight", async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    const inFlight = new Promise<void>((resolve) => {
      release = resolve;
    });

    const api = installMockApi([
      ...baseRoutes(),
      {
        method: "post",
        path: "/students",
        reply: async () => {
          await inFlight;
          return { status: 201, body: envelope(SAVED, "Student created successfully.") };
        }
      },
      { method: "get", path: "/students/:id", reply: () => ({ body: envelope(SAVED) }) }
    ]);

    await openCreateForm();
    await fillRequired(user);

    const submit = screen.getByRole("button", { name: "Create student" });
    await user.click(submit);

    // The button reports that it is working and cannot be pressed again.
    await waitFor(() => expect(submit).toBeDisabled());
    expect(submit).toHaveAttribute("aria-busy", "true");

    // Even a submit event that bypasses the button is ignored while one is in flight.
    const form = submit.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(api.all("post", "/students")).toHaveLength(1);

    release?.();
    await waitFor(() => expect(api.all("get", "/students/77")).toHaveLength(1));
  });

  it("loads the record into the form when editing", async () => {
    const user = userEvent.setup();
    const existing: Student = makeStudent({ id: 12, year_level: 2 });

    const api = installMockApi([
      ...baseRoutes(),
      { method: "get", path: "/students/:id", reply: () => ({ body: envelope(existing) }) },
      {
        method: "put",
        path: "/students/:id",
        reply: () => ({
          status: 200,
          body: envelope({ ...existing, year_level: 4 }, "Student updated successfully.")
        })
      }
    ]);

    withStoredSession();
    renderApp("/students/12/edit");
    await screen.findByRole("heading", { name: "Edit student" });

    // Pre-filled from GET /students/12.
    expect(screen.getByLabelText(/Student number/)).toHaveValue("2026-00012");
    expect(screen.getByLabelText(/First name/)).toHaveValue("Maria");
    expect(screen.getByLabelText(/Last name/)).toHaveValue("Santos");
    expect(screen.getByLabelText(/Year level/)).toHaveValue("2");
    expect(screen.getByLabelText(/Program/)).toHaveValue("2");
    expect(api.all("get", "/students/12")).toHaveLength(1);

    await user.selectOptions(screen.getByLabelText(/Year level/), "4");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.all("put", "/students/12")).toHaveLength(1));
    expect(api.last("put", "/students/12").body).toMatchObject({
      student_number: "2026-00012",
      year_level: 4,
      status: "ACTIVE"
    });
  });

  it("shows a not-found error instead of an empty form when the record is missing", async () => {
    installMockApi([
      ...baseRoutes(),
      {
        method: "get",
        path: "/students/:id",
        reply: () => ({
          status: 404,
          body: failure("No query results for model [App\\Models\\Student] 999.")
        })
      }
    ]);

    withStoredSession();
    renderApp("/students/999/edit");

    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(screen.getByText(/No query results for model/)).toBeInTheDocument();
  });
});
