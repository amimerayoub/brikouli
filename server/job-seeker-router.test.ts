import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { applicationCreateFailure } from "./services/applications";

vi.mock("./services/supabase", async importOriginal => {
  const actual = await importOriginal<typeof import("./services/supabase")>();
  return {
    ...actual,
    verifyActor: vi.fn(async () => ({
      success: true as const,
      data: { profile: { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", role: "job_seeker" } },
    })),
  };
});

const { appRouter } = await import("./routers");

const context = {
  req: { protocol: "https", headers: {} },
  res: { clearCookie: () => undefined },
  user: null,
  supabaseAccessToken: "test-access-token",
} as unknown as TrpcContext;

describe("Job Seeker typed procedure boundaries", () => {
  it("rejects invalid favorite, application, and discovery payloads before protected work begins", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.brikouli.favorites.save({ gigId: "invalid" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.brikouli.applications.create({ gigId: "invalid" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.brikouli.gigs.listForJobSeeker({ sort: "distance" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns a clear duplicate-application response instead of a generic write failure", () => {
    expect(applicationCreateFailure("23505")).toEqual({ success: false, code: "APPLICATION_EXISTS", message: "سبق أن تقدمت إلى هذه الفرصة." });
    expect(applicationCreateFailure("other")).toEqual({ success: false, code: "APPLICATION_CREATE_FAILED", message: "تعذر إرسال طلبك." });
  });
});
