import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { NETWORK_ERROR_MESSAGE, errorTitle, isApiError, toApiError } from "../errors";

/** Builds the axios error shape the interceptor has to understand. */
function axiosErrorWith(status: number, data: unknown): AxiosError {
  const response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: {}
  } as AxiosResponse;

  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response);
}

describe("toApiError", () => {
  it("uses the API's own message for every documented status", () => {
    const cases: Array<[number, string]> = [
      [401, "Unauthenticated."],
      [403, "This action is unauthorized."],
      [404, "Not found."],
      [409, "Cannot delete this program because students are assigned to it."],
      [422, "Validation failed."],
      [500, "Server error."]
    ];

    for (const [status, message] of cases) {
      const result = toApiError(axiosErrorWith(status, { success: false, message }));

      expect(result.status).toBe(status);
      expect(result.message).toBe(message);
    }
  });

  it("exposes 422 field errors so they can be shown under the inputs", () => {
    const error = toApiError(
      axiosErrorWith(422, {
        success: false,
        message: "Validation failed.",
        errors: { student_number: ["The student number has already been taken."] }
      })
    );

    expect(error.fieldErrors).toEqual({
      student_number: ["The student number has already been taken."]
    });
  });

  it("falls back to a readable message when the API sends none", () => {
    expect(toApiError(axiosErrorWith(403, undefined)).message).toBe(
      "You are not allowed to perform this action."
    );
  });

  it("maps a network failure to status 0 with the 'is the server running' hint", () => {
    // No response object at all: the request never reached the server.
    const networkError = new AxiosError("Network Error", "ERR_NETWORK");

    const result = toApiError(networkError);

    expect(result.status).toBe(0);
    expect(result.message).toBe(NETWORK_ERROR_MESSAGE);
    expect(result.fieldErrors).toBeUndefined();
  });

  it("passes an already normalised ApiError straight through", () => {
    const existing = { status: 409, message: "Conflict." };

    expect(isApiError(existing)).toBe(true);
    expect(toApiError(existing)).toBe(existing);
  });

  it("never throws for unexpected values", () => {
    expect(toApiError(new Error("boom")).status).toBe(0);
    expect(toApiError(new Error("boom")).message).toBe("boom");
    expect(toApiError("nonsense").status).toBe(0);
    expect(toApiError(null).status).toBe(0);
    expect(toApiError(undefined).message).toBe("An unexpected error occurred.");
  });

  it("does not mistake a random object for an ApiError", () => {
    expect(isApiError({ status: 401 })).toBe(false);
    expect(isApiError({ message: "hi" })).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe("errorTitle", () => {
  it("maps statuses to a heading, including the network case", () => {
    expect(errorTitle(0)).toBe("Cannot reach the API");
    expect(errorTitle(401)).toBe("Session expired");
    expect(errorTitle(403)).toBe("Not allowed");
    expect(errorTitle(404)).toBe("Not found");
    expect(errorTitle(409)).toBe("Conflict");
    expect(errorTitle(422)).toBe("Check the form");
    expect(errorTitle(500)).toBe("Server error");
    expect(errorTitle(418)).toBe("Something went wrong");
  });
});
