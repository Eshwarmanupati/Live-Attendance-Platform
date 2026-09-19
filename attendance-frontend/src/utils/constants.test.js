import { describe, it, expect } from "vitest";
import { dashboardFor, ROLES, ROUTES } from "./constants";

describe("dashboardFor", () => {
  it("routes each role to its own dashboard", () => {
    expect(dashboardFor(ROLES.TEACHER)).toBe(ROUTES.TEACHER_DASHBOARD);
    expect(dashboardFor(ROLES.STUDENT)).toBe(ROUTES.STUDENT_DASHBOARD);
  });

  it("falls back to the student dashboard for an unknown role", () => {
    expect(dashboardFor(undefined)).toBe(ROUTES.STUDENT_DASHBOARD);
  });
});
