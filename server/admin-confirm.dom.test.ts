// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminConfirmDialog } from "../client/src/components/admin/AdminConfirmDialog";
describe("Phase 9 admin confirmations", () => {
  it("requires an explicit accessible confirmation before a dangerous action callback runs", async () => {
    const confirm = vi.fn(); const close = vi.fn(); const user = userEvent.setup(); render(React.createElement(AdminConfirmDialog, { open: true, title: "حظر الحساب", description: "تحذير إداري", confirmLabel: "تأكيد الحظر", danger: true, onConfirm: confirm, onClose: close }));
    expect(confirm).not.toHaveBeenCalled(); expect(screen.getByRole("dialog", { name: "حظر الحساب" })).toBeTruthy(); await user.click(screen.getByRole("button", { name: "تأكيد الحظر" })); expect(confirm).toHaveBeenCalledOnce();
  });
});
