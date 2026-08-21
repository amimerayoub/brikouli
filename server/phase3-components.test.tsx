import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppButton } from "../client/src/components/phase3/AppButton";
import { EmptyState } from "../client/src/components/phase3/EmptyState";
import { PhaseJobCard } from "../client/src/components/phase3/JobCard";
import { StatusBadge } from "../client/src/components/phase3/StatusBadge";
import { phase3Jobs } from "../client/src/lib/phase3-data";

describe("Phase 3 rendered UI components", () => {
  it("renders branded button variants, a job action card, and required state copy", () => {
    const markup = renderToStaticMarkup(<div><AppButton variant="danger">حذف</AppButton><StatusBadge type="urgent" /><PhaseJobCard job={phase3Jobs[0]!} /><EmptyState title="لا توجد رسائل" description="لا توجد محادثات حالياً" /></div>);
    expect(markup).toContain("app-button-danger");
    expect(markup).toContain("تنظيم رفوف متجر");
    expect(markup).toContain("قدّم الآن");
    expect(markup).toContain("لا توجد رسائل");
  });
});
