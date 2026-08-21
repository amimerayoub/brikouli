import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { JobSeekerGig } from "@shared/brikouli.types";
import { JobSeekerGigCard } from "../client/src/components/jobSeeker/JobSeekerGigCard";
import { JobSeekerCategories } from "../client/src/components/jobSeeker/JobSeekerCategories";
import { JobSeekerCardSkeleton, NoSavedGigs } from "../client/src/components/jobSeeker/JobSeekerFeedback";
import { JobSeekerSearch } from "../client/src/components/jobSeeker/JobSeekerSearch";

Object.defineProperty(globalThis, "location", { value: new URL("https://brikouli.test/"), configurable: true });

const gig: JobSeekerGig = {
  id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1",
  employerId: "4e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1",
  employerName: "متجر الحي",
  employerAvatarUrl: null,
  title: "ترتيب مساحة المتجر",
  description: "وصف صالح لاختبار بطاقة فرصة الباحث عن عمل.",
  category: "متاجر",
  city: "الدار البيضاء",
  neighborhood: "المعاريف",
  latitude: null,
  longitude: null,
  payment: 110,
  paymentType: "fixed",
  duration: "4 ساعات",
  urgent: true,
  status: "active",
  createdAt: new Date().toISOString(),
};

describe("Job Seeker reusable UI", () => {
  it("renders real gig properties with an accessible saved state", () => {
    const html = renderToStaticMarkup(React.createElement(JobSeekerGigCard, { gig, isSaved: true, distanceLabel: "1.2 كم" }));
    expect(html).toContain("ترتيب مساحة المتجر");
    expect(html).toContain("إزالة من المحفوظات");
    expect(html).toContain("1.2 كم");
    expect(html).toContain("عاجل");
  });

  it("renders Arabic search, loading, and saved-list feedback without exposing technical detail", () => {
    const search = renderToStaticMarkup(React.createElement(JobSeekerSearch, { value: "مقهى", onChange: () => undefined, onOpenFilters: () => undefined }));
    const feedback = renderToStaticMarkup(React.createElement(React.Fragment, null, React.createElement(JobSeekerCardSkeleton), React.createElement(NoSavedGigs)));
    expect(search).toContain("ابحث عن فرصة، متجر أو مدينة");
    expect(feedback).toContain("محفوظاتك تنتظر أول فرصة");
    expect(feedback).toContain("جارٍ تحميل الفرصة");
  });

  it("renders an RTL category control with accessible active selection", () => {
    const html = renderToStaticMarkup(React.createElement(JobSeekerCategories, { categories: ["متاجر", "مطاعم"], value: "مطاعم", onChange: () => undefined }));
    expect(html).toContain('aria-label="تصنيفات الفرص"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("مطاعم");
  });
});
