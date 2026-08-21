import React, { type ReactNode } from "react";
import { BriefcaseBusiness, HeartOff, SearchX, WifiOff } from "lucide-react";

export function JobSeekerCardSkeleton() {
  return <article className="job-seeker-gig-card job-seeker-card-skeleton" aria-label="جارٍ تحميل الفرصة"><div className="job-seeker-skeleton job-seeker-skeleton-avatar" /><div className="job-seeker-skeleton-stack"><i /><i /><i /></div></article>;
}

type JobSeekerFeedbackProps = { icon: ReactNode; title: string; description: string; action?: ReactNode };
export function JobSeekerFeedback({ icon, title, description, action }: JobSeekerFeedbackProps) {
  return <section className="job-seeker-feedback" aria-live="polite"><span>{icon}</span><h2>{title}</h2><p>{description}</p>{action}</section>;
}

export function NoSavedGigs() { return <JobSeekerFeedback icon={<HeartOff size={28} />} title="محفوظاتك تنتظر أول فرصة" description="اضغط رمز الحفظ بجانب أي فرصة للعودة إليها في الوقت المناسب." />; }
export function NoSearchResults({ query }: { query: string }) { return <JobSeekerFeedback icon={<SearchX size={28} />} title="لا توجد نتائج مطابقة" description={`لم نعثر على فرص مطابقة لـ «${query}». جرّب كلمة أقصر أو فئة أخرى.`} />; }
export function NoJobsFound() { return <JobSeekerFeedback icon={<BriefcaseBusiness size={28} />} title="لا توجد فرص الآن" description="جرّب توسيع البحث أو عد بعد قليل للاطلاع على منشورات الحي الجديدة." />; }
export function JobSeekerLoadError({ onRetry }: { onRetry: () => void }) { return <JobSeekerFeedback icon={<WifiOff size={28} />} title="تعذر تحميل الفرص" description="تحقق من اتصالك ثم حاول مرة أخرى. لا توجد حاجة لإعادة إدخال بياناتك." action={<button type="button" className="app-button app-button-secondary" onClick={onRetry}>إعادة المحاولة</button>} />; }
