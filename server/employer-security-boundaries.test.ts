import { expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("./services/supabase", () => ({
  verifyActor: vi.fn(async () => ({ success: true as const, data: { profile: { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", role: "job_seeker" } } })),
  createSupabaseForAccessToken: vi.fn(() => ({ rpc })),
}));

const { createEmployerGig, reviewEmployerApplication } = await import("./services/employer");
const gigId = "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1";

it("denies employer gig creation and applicant review before any database RPC for a non-employer role", async () => {
  rpc.mockReset();
  await expect(createEmployerGig("job-seeker-token", { title: "مساعدة في متجر", description: "ترتيب رفوف المتجر", category: "متجر", city: "الدار البيضاء", latitude: null, longitude: null, payment: 120, paymentType: "fixed", duration: "4 ساعات", acceptanceLimit: 1, publish: false })).resolves.toMatchObject({ success: false, code: "FORBIDDEN" });
  await expect(reviewEmployerApplication("job-seeker-token", { applicationId: gigId, decision: "accepted" })).resolves.toMatchObject({ success: false, code: "FORBIDDEN" });
  expect(rpc).not.toHaveBeenCalled();
});
