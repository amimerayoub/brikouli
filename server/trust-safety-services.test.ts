import { beforeEach, expect, it, vi } from "vitest";

const verifyActor = vi.fn(); const rpc = vi.fn(); const from = vi.fn(); const isEmployer = vi.fn();
vi.mock("./services/supabase", () => ({ verifyActor, createSupabaseForAccessToken: vi.fn(() => ({ rpc, from })), createPublicSupabase: vi.fn(() => ({ from })) }));
vi.mock("./services/roles", () => ({ isEmployer }));
const { completeGigSecure, createPrivateReport, getModerationPreview, moderateGigPreview, setTrustedBlock, submitRating } = await import("./services/trustSafety");
const id = "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1";
beforeEach(() => { verifyActor.mockReset(); rpc.mockReset(); from.mockReset(); isEmployer.mockReset(); verifyActor.mockResolvedValue({ success: true, data: { profile: { id, role: "job_seeker" } } }); });

it("returns a structured server error when a rating is not completion-eligible", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "RATING_NOT_ALLOWED" } });
  await expect(submitRating("token", { gigId: id, toUser: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a2", stars: 5 })).resolves.toMatchObject({ success: false, code: "RATING_NOT_ALLOWED" });
  expect(rpc).toHaveBeenCalledWith("submit_completion_rating", expect.objectContaining({ p_stars: 5 }));
});

it("prevents duplicate reports through the protected report RPC", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "REPORT_ALREADY_SUBMITTED" } });
  await expect(createPrivateReport("token", { targetType: "gig", targetId: id, reason: "scam", description: "تفاصيل كافية عن البلاغ" })).resolves.toMatchObject({ success: false, code: "REPORT_ALREADY_SUBMITTED" });
});

it("preserves self-block protection and employer-only completion at the server boundary", async () => {
  rpc.mockResolvedValue({ error: { message: "CANNOT_BLOCK_SELF" } });
  await expect(setTrustedBlock("token", { userId: id, blocked: true })).resolves.toMatchObject({ success: false, code: "CANNOT_BLOCK_SELF" });
  isEmployer.mockReturnValue(false);
  await expect(completeGigSecure("token", { gigId: id })).resolves.toMatchObject({ success: false, code: "FORBIDDEN" });
});

it("classifies safe, review, and blocked Arabic work descriptions without exposing matching rules", () => {
  expect(moderateGigPreview({ title: "ترتيب رفوف متجر", description: "مساعدة لمدة أربع ساعات داخل المتجر", category: "متجر" })).toMatchObject({ allowed: true, riskLevel: "safe" });
  expect(moderateGigPreview({ title: "تركيب سقالة", description: "عمل على ارتفاع", category: "تنظيم" })).toMatchObject({ allowed: false, riskLevel: "review" });
  expect(moderateGigPreview({ title: "إصلاح لوحة كهرباء جهد عال", description: "مطلوب عمل عاجل", category: "أخرى" })).toMatchObject({ allowed: false, riskLevel: "blocked" });
});

it("allows the moderation preview only for an authenticated employer and returns no internal matched rules", async () => {
  isEmployer.mockReturnValue(true);
  await expect(getModerationPreview("token", { title: "ترتيب رفوف", description: "مساعدة داخل المتجر لمدة أربع ساعات", category: "متجر" })).resolves.toEqual({ success: true, data: { allowed: true, riskLevel: "safe", userMessage: null } });
  isEmployer.mockReturnValue(false);
  await expect(getModerationPreview("token", { title: "ترتيب رفوف", description: "مساعدة داخل المتجر لمدة أربع ساعات", category: "متجر" })).resolves.toMatchObject({ success: false, code: "FORBIDDEN" });
});
