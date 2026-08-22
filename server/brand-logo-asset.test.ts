import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const brandLogo = readFileSync(new URL("../client/src/components/branding/BrandLogo.tsx", import.meta.url), "utf8");

describe("optimized Brikouli brand asset", () => {
  it("uses the supplied compact symbol at a constrained responsive size while retaining Arabic accessibility text", () => {
    expect(brandLogo).toContain("brikouli-symbol-optimized_2432a297.png");
    expect(brandLogo).toContain('alt="رمز بريكولي"');
    expect(brandLogo).toContain("h-9 w-9");
    expect(brandLogo).toContain("sm:h-10 sm:w-10");
  });
});
