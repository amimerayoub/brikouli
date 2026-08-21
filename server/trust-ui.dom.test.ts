import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

const ratingMutate = vi.fn(); const reportMutate = vi.fn(); const blockMutate = vi.fn();
vi.mock("../client/src/lib/trpc", () => ({ trpc: { brikouli: { trust: { submitRating: { useMutation: () => ({ mutate: ratingMutate, isPending: false }) } }, reports: { create: { useMutation: () => ({ mutate: reportMutate, isPending: false }) } }, blocks: { set: { useMutation: () => ({ mutate: blockMutate, isPending: false }) } } } } }));
vi.mock("../client/src/hooks/useSupabaseSession", () => ({ useSupabaseSession: () => ({ isAuthenticated: true }) }));
const { RatingSheet } = await import("../client/src/components/trust/RatingSheet");
const { ReportSheet } = await import("../client/src/components/trust/ReportSheet");
const { BlockUserConfirm } = await import("../client/src/components/trust/BlockUserConfirm");
const id = "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1";
afterEach(() => { cleanup(); ratingMutate.mockReset(); reportMutate.mockReset(); blockMutate.mockReset(); });

it("provides an accessible Arabic five-star completion rating submission", async () => {
  const user = userEvent.setup(); render(React.createElement(RatingSheet, { target: { gigId: id, gigTitle: "ترتيب متجر", target: { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a2", fullName: "سارة", avatarUrl: null, role: "employer" }, submitted: false }, onClose: vi.fn(), onSubmitted: vi.fn() }));
  await user.click(screen.getByRole("radio", { name: "4 نجوم" })); await user.type(screen.getByPlaceholderText("اكتب ملاحظتك باحترام…"), "تجربة منظمة ومحترمة"); await user.click(screen.getByRole("button", { name: "إرسال التقييم" }));
  expect(ratingMutate).toHaveBeenCalledWith({ gigId: id, toUser: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a2", stars: 4, comment: "تجربة منظمة ومحترمة" });
});

it("opens the reusable private gig-report sheet with a categorical Arabic radio choice", async () => {
  const user = userEvent.setup(); render(React.createElement(ReportSheet, { targetType: "gig", targetId: id })); await user.click(screen.getByRole("button", { name: "إبلاغ" })); await user.click(screen.getByRole("radio", { name: "احتيال أو نصب" })); await user.type(screen.getByPlaceholderText("اشرح ما لاحظته باختصار…"), "وصف واضح للمشكلة"); await user.click(screen.getByRole("button", { name: "إرسال البلاغ" }));
  expect(reportMutate).toHaveBeenCalledWith({ targetType: "gig", targetId: id, reason: "scam", description: "وصف واضح للمشكلة" });
});

it("requires an Arabic block confirmation before submitting the protected block mutation", async () => {
  const user = userEvent.setup(); render(React.createElement(BlockUserConfirm, { userId: id, userName: "ليلى" })); await user.click(screen.getByRole("button", { name: "حظر المستخدم" })); expect(screen.getByText("هل أنت متأكد من حظر ليلى؟")).toBeTruthy(); expect(blockMutate).not.toHaveBeenCalled(); await user.click(screen.getAllByRole("button", { name: "حظر المستخدم" })[1]!); expect(blockMutate).toHaveBeenCalledWith({ userId: id, blocked: true });
});
