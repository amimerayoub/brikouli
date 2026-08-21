import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

const mutate = vi.fn();
vi.mock("../client/src/lib/trpc", () => ({ trpc: { brikouli: { messaging: { sendText: { useMutation: () => ({ mutate, isPending: false }) }, sendMedia: { useMutation: () => ({ mutate, isPending: false }) } } } } }));
const { ChatComposer } = await import("../client/src/components/messaging/ChatComposer");
afterEach(() => { cleanup(); mutate.mockReset(); });

it("renders Arabic text, image, and voice controls and publishes local typing state", async () => {
  const user = userEvent.setup(); const onTypingChange = vi.fn();
  render(React.createElement(ChatComposer, { conversationId: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", disabled: false, onSent: vi.fn(), onTypingChange }));
  const composer = screen.getByPlaceholderText("اكتب رسالة…"); await user.type(composer, "مرحبا");
  expect(onTypingChange).toHaveBeenCalledWith(true);
  expect(screen.getByLabelText("إضافة صورة")).toBeTruthy();
  expect(screen.getByLabelText("تسجيل رسالة صوتية")).toBeTruthy();
  expect(screen.getByLabelText("إرسال الرسالة")).toBeTruthy();
});
