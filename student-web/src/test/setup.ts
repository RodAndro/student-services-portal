import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";
import { restoreMockApi } from "./mockApi";

/**
 * Messages the application wrote to `console.error` during the current test.
 *
 * React reports real problems here - an error thrown while rendering, a failed
 * state update outside `act`, a missing key - so any of them fails the test instead
 * of scrolling past in the output. That is how "no console errors" is verified across
 * the whole suite rather than by eyeballing a run.
 */
let consoleErrors: string[] = [];

beforeEach(() => {
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args.map((arg) => String(arg)).join(" "));
  });
});

afterEach(() => {
  // Testing Library's automatic cleanup relies on global test hooks, which this
  // project does not enable, so it is wired up explicitly here.
  cleanup();
  window.localStorage.clear();
  // Puts the real axios adapter back so a mock never leaks into another test.
  restoreMockApi();

  const messages = consoleErrors;
  consoleErrors = [];

  expect(messages, `The application logged console errors:\n${messages.join("\n")}`).toEqual([]);
});
