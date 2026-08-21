import { expect, it } from "vitest";
import type { EmployerNotification } from "@shared/brikouli.types";
import { groupEmployerNotifications } from "../client/src/pages/EmployerNotifications";

it("groups only actual employer activity by today and earlier timestamps", () => {
  const items: EmployerNotification[] = [
    { id: "today", type: "new_applicant", title: "متقدم جديد", description: "طلب فعلي", createdAt: "2026-08-21T09:00:00Z", href: "/employer/gigs/a/applicants" },
    { id: "earlier", type: "gig_date_soon", title: "موعد قريب", description: "موعد فعلي", createdAt: "2026-08-20T09:00:00Z", href: "/employer/gigs/a/applicants" },
  ];
  expect(groupEmployerNotifications(items, "2026-08-21")).toEqual({ today: [items[0]], earlier: [items[1]] });
});
