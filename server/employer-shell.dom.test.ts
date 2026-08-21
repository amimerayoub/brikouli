import React from "react";
import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("../client/src/hooks/useSupabaseSession", () => ({ useSupabaseSession: () => ({ user: null, loading: false, isAuthenticated: false }) }));
const { EmployerAccessState, EmployerShell } = await import("../client/src/components/employer/EmployerShell");
afterEach(cleanup);

it("renders a mobile-safe Employer Workspace shell and access state with all primary destinations", () => {
  const { container } = render(React.createElement(EmployerShell, { title: "لوحة النشاط", subtitle: "ملخص اليوم" }, React.createElement("p", null, "محتوى")));
  expect(container.querySelector(".employer-shell")).toBeTruthy();
  expect(container.querySelector(".employer-bottom-nav")).toBeTruthy();
  expect(screen.getByRole("navigation", { name: "تنقل صاحب العمل على الهاتف" })).toBeTruthy();
  cleanup();
  const access = render(React.createElement(EmployerAccessState, { type: "login" }));
  expect(access.container.querySelector(".employer-access-state")).toBeTruthy();
  expect(screen.getByRole("link", { name: "تسجيل الدخول" }).getAttribute("href")).toBe("/login");
  const css = readFileSync(`${process.cwd()}/client/src/styles/employer.css`, "utf8");
  expect(css).toContain(".employer-shell { min-height: 100vh; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden; direction: rtl;");
  expect(css).toContain(".employer-access-state { position: fixed; inset: 0; width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden; direction: rtl;");
});
