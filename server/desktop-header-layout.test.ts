import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync(new URL("../client/src/components/phase3/AppShell.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/styles/desktop-header.css", import.meta.url), "utf8");

describe("role-aware desktop header", () => {
  it("uses the server-backed profile role for desktop navigation while keeping mobile navigation role-aware", () => {
    expect(shell).toContain("trpc.brikouli.profile.me.useQuery");
    expect(shell).toContain('role === "employer" ? employerDesktopNavigation : jobSeekerDesktopNavigation');
    expect(shell).toContain("jobSeekerMobileNavigation");
    expect(shell).toContain("employerMobileNavigation");
    expect(shell).toContain('label: "الرئيسية", href: "/"');
    expect(shell).toContain('label: "لوحة الأعمال", href: "/employer"');
    expect(shell).toContain('label: "نشر مهمة", href: "/employer/new"');
    expect(shell).not.toContain('links.slice(0, 3)');
  });

  it("provides the existing messages route, unread badge, profile menu, logout, and premium desktop-only layout", () => {
    expect(shell).toContain('href="/messages"');
    expect(shell).toContain("conversation.unreadCount");
    expect(shell).toContain("desktop-profile-menu");
    expect(shell).toContain("getSupabaseBrowserClient().auth.signOut()");
    expect(styles).toContain("@media (min-width:1024px)");
    expect(styles).toContain("width:min(100%,1440px)");
    expect(styles).toContain("grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)");
    expect(styles).toContain("gap:40px");
    expect(styles).toContain("gap:16px");
    expect(styles).toContain("height:72px");
  });
});
