import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./services/supabase", async importOriginal => {
  const actual = await importOriginal<typeof import("./services/supabase")>();
  return { ...actual, verifyActor: vi.fn(async () => ({ success: true as const, data: { profile: { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", role: "employer" } } })) };
});

const { appRouter } = await import("./routers");

const context = { req: { protocol: "https", headers: {} }, res: { clearCookie: () => undefined }, user: null, supabaseAccessToken: "test-employer-token" } as unknown as TrpcContext;

describe("Employer Workspace procedure boundaries", () => {
  it("rejects invalid gig, lifecycle, review, and business-profile payloads before an authenticated service call", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.brikouli.employer.gigs.create({ title: "قصير" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.brikouli.employer.gigs.pause({ gigId: "not-a-uuid" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.brikouli.employer.applicants.review({ applicationId: "not-a-uuid", decision: "accepted" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.brikouli.employer.profile.update({ fullName: "أ", businessCategory: "مخاطر" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
