import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const verifyActor = vi.fn();
const dashboard = vi.fn(async () => ({ success: true as const, data: { stats: {}, activity: [], recentReports: [], moderationQueue: [] } }));
vi.mock("./services/supabase", async importOriginal => {
  const actual = await importOriginal<typeof import("./services/supabase")>();
  return { ...actual, verifyActor };
});
vi.mock("./services/admin", () => ({ getAdminDashboard: dashboard }));

const { appRouter } = await import("./routers");
const base = { req: { protocol: "https", headers: {} }, res: { clearCookie: () => undefined }, user: null } as unknown as TrpcContext;

describe("Phase 9 Super Admin router boundary", () => {
  it("rejects an unauthenticated caller before an admin service can run", async () => {
    verifyActor.mockClear(); dashboard.mockClear();
    const caller = appRouter.createCaller({ ...base, supabaseAccessToken: null });
    await expect(caller.brikouli.admin.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(dashboard).not.toHaveBeenCalled();
  });

  it("rejects a trusted non-admin profile before an admin service can run", async () => {
    verifyActor.mockResolvedValue({ success: true, data: { profile: { id: "315f4951-6a3d-45fd-901f-61d7f2b465b7", role: "employer" } } }); dashboard.mockClear();
    const caller = appRouter.createCaller({ ...base, supabaseAccessToken: "non-admin-token" });
    await expect(caller.brikouli.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dashboard).not.toHaveBeenCalled();
  });

  it("rejects a suspended trusted admin before a privileged service can run", async () => {
    verifyActor.mockResolvedValue({ success: true, data: { profile: { id: "315f4951-6a3d-45fd-901f-61d7f2b465b7", role: "admin", accountStatus: "suspended" } } }); dashboard.mockClear();
    const caller = appRouter.createCaller({ ...base, supabaseAccessToken: "suspended-admin-token" });
    await expect(caller.brikouli.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dashboard).not.toHaveBeenCalled();
  });

  it("allows only a database-verified admin profile through to the dashboard service", async () => {
    verifyActor.mockResolvedValue({ success: true, data: { profile: { id: "315f4951-6a3d-45fd-901f-61d7f2b465b7", role: "admin" } } }); dashboard.mockClear();
    const caller = appRouter.createCaller({ ...base, supabaseAccessToken: "admin-token" });
    await expect(caller.brikouli.admin.dashboard()).resolves.toMatchObject({ success: true });
    expect(dashboard).toHaveBeenCalledWith("admin-token");
  });
});
