import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("Vercel deployment contract", () => {
  it("keeps the Vite build output and bundled API-directory Express function aligned", () => {
    const config = JSON.parse(read("vercel.json")) as { framework?: string; buildCommand?: string; outputDirectory?: string; functions?: Record<string, { includeFiles?: string }> };
    expect(config.framework).toBe("vite");
    expect(config.buildCommand).toBe("pnpm run vercel-build");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.functions?.["api/index.ts"]?.includeFiles).toBe("dist/public/**");
    expect(config).toMatchObject({ rewrites: [{ source: "/(.*)", destination: "/api" }] });
    expect(read("api/index.ts")).toContain('require("./_brikouli.cjs")');
    expect(read("api/_brikouli-entry.ts")).toContain("export default app");
    expect(read("api/_brikouli-entry.ts")).not.toContain("../server/_core/index");
    expect(read("api/_brikouli-entry.ts")).not.toContain("../server/_core/vite");
    expect(read("package.json")).toContain("api/_brikouli-entry.ts --platform=node --bundle --format=cjs");
  });

  it("keeps unauthenticated recovery on the local login page when Manus OAuth configuration is absent", () => {
    const source = read("client/src/const.ts");
    expect(source).toContain("if (!oauthPortalUrl || !appId)");
    expect(source).toContain("window.location.assign(`/login?next=${encodeURIComponent(currentPath)}`)");
  });
});
