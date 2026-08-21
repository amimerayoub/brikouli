import React, { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { JobSeekerGig } from "@shared/brikouli.types";
import { JobSeekerGigCard } from "../client/src/components/jobSeeker/JobSeekerGigCard";
import { MarkerPopup } from "../client/src/components/maps/MarkerPopup";
import { NotificationCards, markNoticesRead, type Notice } from "../client/src/pages/Notifications";
import { SavedGigCards } from "../client/src/pages/SavedGigs";

afterEach(cleanup);

const gig: JobSeekerGig = { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", employerId: "4e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", employerName: "متجر الحي", employerAvatarUrl: null, title: "ترتيب مساحة المتجر", description: "وصف للاختبار.", category: "متاجر", city: "الدار البيضاء", neighborhood: "المعاريف", latitude: null, longitude: null, payment: 110, paymentType: "fixed", duration: "4 ساعات", urgent: false, status: "active", createdAt: "2026-08-21T09:00:00.000Z" };
const notices: Notice[] = [{ id: "notice-1", title: "طلبك قيد المراجعة", description: "ترتيب مساحة المتجر", createdAt: "2026-08-21T09:00:00.000Z", status: "pending", href: "/applications" }, { id: "notice-2", title: "تم قبول طلبك", description: "فرصة محلية", createdAt: "2026-08-19T09:00:00.000Z", status: "accepted", href: "/applications" }];

function SavedCardHarness() { const [saved, setSaved] = useState(false); return React.createElement(JobSeekerGigCard, { gig, isSaved: saved, onToggleSave: () => setSaved(value => !value) }); }
function MarkerHarness() { const [saved, setSaved] = useState(false); return React.createElement(MarkerPopup, { gig: { ...gig, distanceMeters: 700 }, onClose: () => undefined, isSaved: saved, onToggleSave: () => setSaved(value => !value) }); }
function SavedGigsHarness() { const [items, setItems] = useState([{ ...gig, savedAt: "2026-08-21T09:00:00.000Z" }]); return React.createElement(SavedGigCards, { gigs: items, onRemove: gigId => setItems(value => value.filter(item => item.id !== gigId)) }); }
function NotificationsHarness() { const [readIds, setReadIds] = useState<Set<string>>(() => new Set()); return React.createElement(React.Fragment, null, React.createElement("button", { type: "button", onClick: () => setReadIds(value => markNoticesRead(value, notices.map(notice => notice.id))) }, "تعليم الكل كمقروء"), React.createElement(NotificationCards, { items: notices, readIds, onRead: id => setReadIds(value => markNoticesRead(value, [id])) })); }

describe("Job Seeker rendered interactions", () => {
  it("updates saved-gig affordances immediately on the discovery card and MapLibre marker sheet", async () => {
    const user = userEvent.setup();
    const first = render(React.createElement(SavedCardHarness));
    await user.click(screen.getByRole("button", { name: "حفظ الفرصة" }));
    expect(screen.getByRole("button", { name: "إزالة من المحفوظات" })).toBeTruthy();
    first.unmount();
    render(React.createElement(MarkerHarness));
    await user.click(screen.getByRole("button", { name: "حفظ الفرصة" }));
    expect(screen.getByRole("button", { name: "محفوظة في حسابك" })).toBeTruthy();
  });

  it("removes a rendered Saved Gigs card immediately after its saved control is pressed", async () => {
    const user = userEvent.setup();
    render(React.createElement(SavedGigsHarness));
    await user.click(screen.getByRole("button", { name: "إزالة من المحفوظات" }));
    expect(screen.queryByText("ترتيب مساحة المتجر")).toBeNull();
  });

  it("updates individual and mark-all notification read state in the rendered interface", async () => {
    const user = userEvent.setup();
    render(React.createElement(NotificationsHarness));
    expect(screen.getAllByLabelText("غير مقروء")).toHaveLength(2);
    await user.click(screen.getByText("طلبك قيد المراجعة"));
    expect(screen.getAllByLabelText("غير مقروء")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "تعليم الكل كمقروء" }));
    expect(screen.queryByLabelText("غير مقروء")).toBeNull();
  });
});
