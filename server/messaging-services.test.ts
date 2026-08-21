import { beforeEach, expect, it, vi } from "vitest";

const verifyActor = vi.fn();
const from = vi.fn();
const rpc = vi.fn();
const storagePut = vi.fn();
vi.mock("./services/supabase", () => ({ verifyActor, createSupabaseForAccessToken: vi.fn(() => ({ from, rpc })) }));
vi.mock("./storage", () => ({ storagePut, storageGetSignedUrl: vi.fn() }));

const { closeConversation, markConversationRead, sendMediaMessage, sendTextMessage, updateConversationMember } = await import("./services/messaging");
const conversationId = "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1";

beforeEach(() => { verifyActor.mockReset(); from.mockReset(); rpc.mockReset(); storagePut.mockReset(); });

it("denies a non-participant role before querying conversations or uploading media", async () => {
  verifyActor.mockResolvedValue({ success: true, data: { profile: { id: conversationId, role: "admin" } } });
  await expect(sendTextMessage("token", { conversationId, content: "رسالة آمنة" })).resolves.toMatchObject({ success: false, code: "FORBIDDEN" });
  await expect(sendMediaMessage("token", { conversationId, fileName: "bad.png", mimeType: "image/png", dataUrl: "data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAA==", durationMs: null })).resolves.toMatchObject({ success: false, code: "FORBIDDEN" });
  expect(from).not.toHaveBeenCalled(); expect(storagePut).not.toHaveBeenCalled();
});

it("keeps closed conversations read-only before inserting a user message", async () => {
  verifyActor.mockResolvedValue({ success: true, data: { profile: { id: conversationId, role: "job_seeker" } } });
  from.mockImplementation((table: string) => table === "conversations" ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: conversationId, employer_id: "e", job_seeker_id: conversationId, status: "closed" }, error: null }) }) }) } : { insert: vi.fn() });
  await expect(sendTextMessage("token", { conversationId, content: "رسالة بعد الإغلاق" })).resolves.toMatchObject({ success: false, code: "CONVERSATION_CLOSED" });
  expect(from).toHaveBeenCalledWith("conversations"); expect(from).not.toHaveBeenCalledWith("messages");
});

it("rejects dangerous or invalid media data before storing bytes", async () => {
  verifyActor.mockResolvedValue({ success: true, data: { profile: { id: conversationId, role: "job_seeker" } } });
  await expect(sendMediaMessage("token", { conversationId, fileName: "payload.svg", mimeType: "image/png", dataUrl: "data:image/png;base64,PHN2Zz48L3N2Zz4=", durationMs: null })).resolves.toMatchObject({ success: false, code: "MEDIA_INVALID" });
  expect(storagePut).not.toHaveBeenCalled();
});

it("marks an owned conversation read only through the protected database RPC", async () => {
  verifyActor.mockResolvedValue({ success: true, data: { profile: { id: conversationId, role: "job_seeker" } } }); rpc.mockResolvedValue({ error: null });
  await expect(markConversationRead("token", { conversationId })).resolves.toEqual({ success: true, data: { conversationId } });
  expect(rpc).toHaveBeenCalledWith("mark_conversation_read", { p_conversation_id: conversationId });
});

it("archives a conversation only in the current participant membership row", async () => {
  verifyActor.mockResolvedValue({ success: true, data: { profile: { id: conversationId, role: "job_seeker" } } }); const maybeSingle = vi.fn(async () => ({ data: { conversation_id: conversationId }, error: null })); const select = vi.fn(() => ({ maybeSingle })); const secondEq = vi.fn(() => ({ select })); const firstEq = vi.fn(() => ({ eq: secondEq })); const update = vi.fn(() => ({ eq: firstEq })); from.mockReturnValue({ update });
  await expect(updateConversationMember("token", { conversationId, archived: true })).resolves.toEqual({ success: true, data: { conversationId } });
  expect(from).toHaveBeenCalledWith("conversation_members"); expect(update).toHaveBeenCalledWith(expect.objectContaining({ archived_at: expect.any(String) })); expect(firstEq).toHaveBeenCalledWith("conversation_id", conversationId); expect(secondEq).toHaveBeenCalledWith("user_id", conversationId);
});

it("closes a participant-owned conversation through its protected database RPC", async () => {
  verifyActor.mockResolvedValue({ success: true, data: { profile: { id: conversationId, role: "employer" } } }); rpc.mockResolvedValue({ data: { id: conversationId }, error: null });
  await expect(closeConversation("token", { conversationId })).resolves.toEqual({ success: true, data: { conversationId } });
  expect(rpc).toHaveBeenCalledWith("close_owned_conversation", { p_conversation_id: conversationId });
});
