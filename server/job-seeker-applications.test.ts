import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Job Seeker application tracking", () => {
  it("registers the destination used by the detail success action and queries status-filtered applications", () => {
    const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    const page = readFileSync(new URL("../client/src/pages/Applications.tsx", import.meta.url), "utf8");
    expect(app).toContain('path={"/applications"}');
    expect(page).toContain("trpc.brikouli.applications.mine.useQuery");
    expect(page).toContain('"pending"');
    expect(page).toContain('"accepted"');
    expect(page).toContain('"rejected"');
  });
});
