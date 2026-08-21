import { describe, expect, it } from "vitest";
import type { JobSeekerApplication } from "@shared/brikouli.types";
import { buildApplicationNotices, groupNotices, markNoticesRead } from "../client/src/pages/Notifications";

const applications: JobSeekerApplication[] = [
  { id: "a", gigId: "g1", status: "pending", createdAt: "2026-08-21T09:00:00.000Z", gig: null },
  { id: "b", gigId: "g2", status: "accepted", createdAt: "2026-08-19T09:00:00.000Z", gig: null },
];

describe("Notification Center behavior", () => {
  it("derives only actual application notices and groups today versus earlier deterministically", () => {
    const notices = buildApplicationNotices(applications);
    const groups = groupNotices(notices, new Date("2026-08-21T18:00:00.000Z"));
    expect(notices).toHaveLength(2);
    expect(notices[0]?.title).toBe("طلبك قيد المراجعة");
    expect(groups.today.map(notice => notice.id)).toEqual(["a"]);
    expect(groups.earlier.map(notice => notice.id)).toEqual(["b"]);
  });

  it("marks an individual or all derived notice IDs read without generating extra notices", () => {
    expect([...markNoticesRead(new Set(), ["a"])]).toEqual(["a"]);
    expect([...markNoticesRead(new Set(["a"]), ["a", "b"])]).toEqual(["a", "b"]);
    expect(buildApplicationNotices([])).toEqual([]);
  });
});
