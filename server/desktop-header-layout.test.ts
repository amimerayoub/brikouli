import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync(new URL("../client/src/components/phase3/AppShell.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/styles/desktop-header.css", import.meta.url), "utf8");

describe("desktop header layout", () => {
  it("keeps the existing header controls while isolating the premium grid to desktop widths", () => {
    expect(shell).toContain('className="phase-header-inner"');
    expect(shell).toContain("links.slice(0, 3)");
    expect(shell).toContain("<ThemeToggle />");
    expect(shell).toContain("<PhaseBottomNavigation activePath={location} />");
    expect(styles).toContain("@media (min-width:1024px)");
    expect(styles).toContain("width:min(100%,1440px)");
    expect(styles).toContain("grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)");
    expect(styles).toContain("gap:40px");
    expect(styles).toContain("height:72px");
  });
});
