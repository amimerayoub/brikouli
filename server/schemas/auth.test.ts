import { describe, expect, it } from "vitest";
import { loginSchema, phoneOtpSchema, registerSchema, verifyOtpSchema } from "./auth";

describe("Phase 2 authentication input validation", () => {
  it("requires a strong enough email-password sign-in payload", () => {
    expect(loginSchema.safeParse({ email: "wrong", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "user@example.com", password: "secure-pass" }).success).toBe(true);
  });

  it("requires acceptance of the platform disclaimer before registration", () => {
    const base = { fullName: "سلمى بنعلي", email: "salma@example.com", password: "secure-pass", role: "job_seeker" as const };
    expect(registerSchema.safeParse({ ...base, acceptedTerms: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptedTerms: true }).success).toBe(true);
  });

  it("accepts only international phone numbers and six-digit verification codes", () => {
    expect(phoneOtpSchema.safeParse({ phone: "0600000000" }).success).toBe(false);
    expect(phoneOtpSchema.safeParse({ phone: "+212600000000" }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ phone: "+212600000000", token: "123456" }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ phone: "+212600000000", token: "123" }).success).toBe(false);
  });
});
