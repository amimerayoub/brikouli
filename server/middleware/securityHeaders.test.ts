import { describe, expect, it, vi } from "vitest";
import { applySecurityHeaders } from "./securityHeaders";

function run(headers: Record<string, string> = {}, secure = false) { const setHeader = vi.fn(); const next = vi.fn(); applySecurityHeaders({ headers, secure } as never, { setHeader } as never, next); return { setHeader, next }; }
describe("security headers", () => {
  it("sets baseline anti-sniffing, privacy, policy, and CSP defenses without network-source restrictions", () => { const { setHeader, next } = run(); expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff"); expect(setHeader).toHaveBeenCalledWith("Referrer-Policy", "strict-origin-when-cross-origin"); expect(setHeader).toHaveBeenCalledWith("Permissions-Policy", expect.stringContaining("payment=()")); expect(setHeader).toHaveBeenCalledWith("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'self'"); expect(next).toHaveBeenCalledOnce(); });
  it("sets HSTS only for an HTTPS request or trusted proxy signal", () => { expect(run().setHeader).not.toHaveBeenCalledWith("Strict-Transport-Security", expect.any(String)); expect(run({ "x-forwarded-proto": "https" }).setHeader).toHaveBeenCalledWith("Strict-Transport-Security", expect.stringContaining("max-age")); });
});
