import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("wouter", () => ({ Link: ({ children }: { children: unknown }) => children }));
import { AppButton } from "../client/src/components/phase3/AppButton";
import { EmptyState } from "../client/src/components/phase3/EmptyState";
import { PhaseJobCard } from "../client/src/components/phase3/JobCard";
import { StatusBadge } from "../client/src/components/phase3/StatusBadge";
import { PhaseBottomNavigation } from "../client/src/components/phase3/AppShell";
import { phase3Jobs } from "../client/src/lib/phase3-data";

describe("Phase 3 rendered UI components", () => {
  it("renders branded button variants, a job action card, and required state copy", () => {
    const markup = renderToStaticMarkup(createElement("div", null,
      createElement(AppButton, { variant: "danger" }, "حذف"),
      createElement(StatusBadge, { type: "urgent" }),
      createElement(PhaseJobCard, { job: phase3Jobs[0]! }),
      createElement(EmptyState, { title: "لا توجد رسائل", description: "لا توجد محادثات حالياً" }),
    ));
    expect(markup).toContain("app-button-danger");
    expect(markup).toContain("تنظيم رفوف متجر");
    expect(markup).toContain("قدّم الآن");
    expect(markup).toContain("لا توجد رسائل");
  });

  it("renders all primary Arabic tabs in the fixed mobile navigation", () => {
    const markup = renderToStaticMarkup(createElement(PhaseBottomNavigation, { activePath: "/explore" }));
    expect(markup).toContain("الرئيسية");
    expect(markup).toContain("استكشف");
    expect(markup).toContain("نشر مهمة");
    expect(markup).toContain("الرسائل");
    expect(markup).toContain("حسابي");
  });
});
