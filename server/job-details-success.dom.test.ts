import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("../client/src/lib/trpc", () => ({ trpc: { brikouli: { gigs: { detail: { useQuery: () => ({}) } }, favorites: { ids: { useQuery: () => ({}) }, save: { useMutation: () => ({}) }, remove: { useMutation: () => ({}) } }, applications: { create: { useMutation: () => ({}) } } }, useUtils: () => ({}) } }));
vi.mock("../client/src/hooks/useSupabaseSession", () => ({ useSupabaseSession: () => ({ isAuthenticated: true }) }));

const { ApplicationSuccessPanel } = await import("../client/src/pages/JobDetails");
afterEach(cleanup);

it("renders the Job Details success sheet and closes it through the real Application Tracking action", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(React.createElement(ApplicationSuccessPanel, { onClose }));
  const tracking = screen.getByRole("link", { name: "متابعة طلباتي" });
  expect(tracking.getAttribute("href")).toBe("/applications");
  await user.click(tracking);
  expect(onClose).toHaveBeenCalledOnce();
});
