import { describe, expect, it } from "vitest";
import { hasRequiredRole, requiredRoleForPath } from "./routeProtection";

describe("server protected route rules", () => {
  it("identifies every Phase 2 private path", () => {
    expect(requiredRoleForPath("/dashboard")).toBe("authenticated");
    expect(requiredRoleForPath("/profile/edit")).toBe("authenticated");
    expect(requiredRoleForPath("/messages")).toBe("authenticated");
    expect(requiredRoleForPath("/employer")).toBe("employer");
    expect(requiredRoleForPath("/admin/users")).toBe("admin");
  });

  it("permits only the required server-side roles", () => {
    expect(hasRequiredRole("job_seeker", "authenticated")).toBe(true);
    expect(hasRequiredRole("job_seeker", "employer")).toBe(false);
    expect(hasRequiredRole("employer", "employer")).toBe(true);
    expect(hasRequiredRole("employer", "admin")).toBe(false);
    expect(hasRequiredRole("admin", "admin")).toBe(true);
  });
});
