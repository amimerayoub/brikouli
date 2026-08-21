import { describe, expect, it } from "vitest";

describe("Supabase public authentication configuration", () => {
  it("accepts the configured publishable key on the Auth settings endpoint", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
    expect(key).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key! },
    });

    expect(response.ok).toBe(true);
  }, 15_000);
});
