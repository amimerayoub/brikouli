import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: gigId, full_name: "باحث عن فرصة", avatar_url: null, rating: 0, completed_jobs: 0, city: null }, error: null }) }) }) }));
vi.mock("./services/supabase", () => ({
  verifyActor: vi.fn(async () => ({ success: true as const, data: { profile: { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", role: "employer", fullName: "صاحب نشاط", phone: null, city: null, neighborhood: null, avatarUrl: null, rating: 0, completedJobs: 0, acceptedTerms: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" } } })),
  createSupabaseForAccessToken: vi.fn(() => ({ rpc, from })),
}));

const { deleteEmployerGig, reviewEmployerApplication, updateEmployerBusinessProfileSecure } = await import("./services/employer");
const gigId = "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1";
const applicationId = "2f14fc7c-0a76-49be-98b9-7b07e97e5534";

describe("Employer-owned RPC behavior", () => {
  beforeEach(() => rpc.mockReset());

  it("uses the employer-only profile RPC rather than a direct profile update", async () => {
    rpc.mockReturnValue({ single: async () => ({ data: { full_name: "صاحب نشاط", phone: null, city: "الدار البيضاء", neighborhood: null, avatar_url: null, updated_at: "2026-08-21", business_name: "متجر الحي", business_category: "متجر", business_description: null }, error: null }) });
    const result = await updateEmployerBusinessProfileSecure("token", { fullName: "صاحب نشاط", city: "الدار البيضاء", businessName: "متجر الحي", businessCategory: "متجر" });
    expect(result.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith("update_employer_business_profile", expect.objectContaining({ p_business_name: "متجر الحي" }));
  });

  it("sends applicant review through the single-hire RPC", async () => {
    rpc.mockReturnValue({ single: async () => ({ data: { id: applicationId, gig_id: gigId, applicant_id: gigId, status: "accepted", created_at: "2026-08-21", reviewed_at: "2026-08-21" }, error: null }) });
    const result = await reviewEmployerApplication("token", { applicationId, decision: "accepted" });
    expect(rpc).toHaveBeenCalledWith("review_employer_application", { p_application_id: applicationId, p_decision: "accepted" });
    expect(result.success).toBe(true);
  });

  it("deletes a database-approved safe gig and preserves cancellation-first and applicant-history blocks", async () => {
    rpc.mockReturnValueOnce(Promise.resolve({ data: gigId, error: null }));
    await expect(deleteEmployerGig("token", { gigId })).resolves.toEqual({ success: true, data: { gigId } });
    expect(rpc).toHaveBeenCalledWith("delete_employer_gig", { p_gig_id: gigId });

    rpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: "GIG_MUST_BE_CANCELLED_FIRST" } }));
    await expect(deleteEmployerGig("token", { gigId })).resolves.toMatchObject({ success: false, code: "GIG_MUST_BE_CANCELLED_FIRST" });

    rpc.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: "GIG_HAS_APPLICANT_HISTORY" } }));
    await expect(deleteEmployerGig("token", { gigId })).resolves.toMatchObject({ success: false, code: "GIG_HAS_APPLICANT_HISTORY" });
  });
});
