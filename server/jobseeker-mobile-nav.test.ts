import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync(new URL("../client/src/components/phase3/AppShell.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/styles/jobseeker-mobile-nav.css", import.meta.url), "utf8");

describe("Job Seeker mobile navigation", () => {
  it("applies the premium modifier only outside the employer role and keeps publish actions employer-only", () => {
    expect(shell).toContain('role === "employer" ? "is-employer" : "is-job-seeker"');
    expect(shell).toContain("jobSeekerMobileNavigation");
    expect(shell).toContain("employerMobileNavigation");
    expect(styles).toContain(".phase-bottom-nav.is-job-seeker");
    expect(styles).toContain("height:calc(80px + env(safe-area-inset-bottom))");
    expect(styles).toContain("gap:8px");
    expect(styles).toContain("min-height:48px");
    expect(styles).toContain("width:24px;height:24px");
    expect(styles).toContain("transform:scale(1.08)");
    expect(styles).toContain("transform:scale(.96)");
    expect(styles).toContain("box-shadow:0 0 10px rgba(22,163,74,.6)");
  });
});
