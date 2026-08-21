import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JobSeekerApplication } from "@shared/brikouli.types";

const mocks = vi.hoisted(() => ({ query: {} as Record<string, unknown> }));
vi.mock("../client/src/lib/trpc", () => ({ trpc: { brikouli: { applications: { mine: { useQuery: () => mocks.query } } } } }));
vi.mock("../client/src/hooks/useSupabaseSession", () => ({ useSupabaseSession: () => ({ isAuthenticated: true, loading: false, user: { id: "user" } }) }));
vi.mock("../client/src/components/phase3/AppShell", async () => { const ReactRuntime = await import("react"); return { AppShell: ({ children }: { children: React.ReactNode }) => ReactRuntime.createElement("div", null, children), PageHeading: ({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) => ReactRuntime.createElement("header", null, eyebrow ? ReactRuntime.createElement("p", null, eyebrow) : null, ReactRuntime.createElement("h1", null, title), action) }; });

const { default: Notifications } = await import("../client/src/pages/Notifications");
afterEach(cleanup);

const applications: JobSeekerApplication[] = [
  { id: "today", gigId: "gig-a", status: "pending", createdAt: new Date().toISOString(), gig: null },
  { id: "earlier", gigId: "gig-b", status: "accepted", createdAt: "2026-08-19T09:00:00.000Z", gig: null },
];
const refetch = vi.fn();
function setQuery(next: Record<string, unknown>) { mocks.query = { isLoading: false, isError: false, data: undefined, refetch, ...next }; }

describe("Notification Center page states", () => {
  beforeEach(() => { refetch.mockReset(); });

  it("renders loading skeletons, empty and error recovery states from the actual page", () => {
    setQuery({ isLoading: true });
    const view = render(React.createElement(Notifications));
    expect(screen.getAllByLabelText("جارٍ تحميل الفرصة")).toHaveLength(2);
    setQuery({ data: { success: true, data: [] } });
    view.rerender(React.createElement(Notifications));
    expect(screen.getByText("لا توجد تحديثات بعد")).toBeTruthy();
    setQuery({ isError: true });
    view.rerender(React.createElement(Notifications));
    expect(screen.getByText("تعذر تحميل الفرص")).toBeTruthy();
  });

  it("renders today/earlier groups and updates individual and mark-all read controls", async () => {
    const user = userEvent.setup();
    setQuery({ data: { success: true, data: applications } });
    render(React.createElement(Notifications));
    expect(screen.getByText("اليوم")).toBeTruthy();
    expect(screen.getByText("سابقاً")).toBeTruthy();
    expect(screen.getAllByLabelText("غير مقروء")).toHaveLength(2);
    await user.click(screen.getByText("طلبك قيد المراجعة"));
    expect(screen.getAllByLabelText("غير مقروء")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "تعليم الكل كمقروء" }));
    expect(screen.queryByLabelText("غير مقروء")).toBeNull();
  });
});
