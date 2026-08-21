import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

describe("Supabase RLS foundation", () => {
  it("denies anonymous gig creation while allowing public safe-profile and active-gig reads", async () => {
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: listError } = await client.from("gigs").select("id").eq("status", "active").limit(1);
    expect(listError).toBeNull();
    const { error: profileViewError } = await client.from("public_profiles").select("id,full_name,rating").limit(1);
    expect(profileViewError).toBeNull();
    const { error: insertError } = await client.from("gigs").insert({ title: "محاولة مجهولة", description: "هذه محاولة يجب أن يمنعها نظام RLS.", category: "اختبار", city: "مراكش", payment: 1, duration: "ساعة" });
    expect(insertError).not.toBeNull();
  }, 15_000);
});
