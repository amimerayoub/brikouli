import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Job Seeker detail and application flow", () => {
  it("uses live detail and favorite contracts rather than the Phase 3 fixture data", () => {
    const page = readFileSync(new URL("../client/src/pages/JobDetails.tsx", import.meta.url), "utf8");
    expect(page).toContain("trpc.brikouli.gigs.detail.useQuery");
    expect(page).toContain("trpc.brikouli.favorites.ids.useQuery");
    expect(page).toContain("trpc.brikouli.favorites.save.useMutation");
    expect(page).not.toContain("jobById");
  });

  it("includes review, duplicate-aware submission, optional voice placeholder, and a success route", () => {
    const page = readFileSync(new URL("../client/src/pages/JobDetails.tsx", import.meta.url), "utf8");
    expect(page).toContain("trpc.brikouli.applications.create.useMutation");
    expect(page).toContain('response.code === "APPLICATION_EXISTS"');
    expect(page).toContain("رسالة صوتية اختيارية");
    expect(page).toContain("تم إرسال طلبك");
    expect(page).toContain('href="/applications"');
    expect(page).toContain("motion.div");
  });
});
