import React, { useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AppShell, PageHeading } from "@/components/phase3/AppShell";
import { JobSeekerCardSkeleton, JobSeekerFeedback, JobSeekerLoadError } from "@/components/jobSeeker/JobSeekerFeedback";
import type { JobSeekerApplication } from "@shared/brikouli.types";

export type Notice = { id: string; title: string; description: string; createdAt: string; status: "pending" | "accepted" | "rejected"; href: string };
export function buildApplicationNotices(applications: JobSeekerApplication[]): Notice[] { return applications.map(application => ({ id: application.id, title: application.status === "accepted" ? "تم قبول طلبك" : application.status === "rejected" ? "يوجد تحديث على طلبك" : "طلبك قيد المراجعة", description: application.gig ? `${application.gig.title} · ${application.gig.employerName}` : "فرصة محلية", createdAt: application.createdAt, status: application.status, href: "/applications" })); }
export function groupNotices(notices: Notice[], now = new Date()) { return notices.reduce<{ today: Notice[]; earlier: Notice[] }>((groups, notice) => { const date = new Date(notice.createdAt); const destination = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate() ? groups.today : groups.earlier; destination.push(notice); return groups; }, { today: [], earlier: [] }); }
export function markNoticesRead(current: Set<string>, ids: string[]) { return new Set([...Array.from(current), ...ids]); }
export function NotificationCards({ items, readIds, onRead }: { items: Notice[]; readIds: Set<string>; onRead: (id: string) => void }) { return <div className="notification-list">{items.map(notice => { const Icon = notice.status === "accepted" ? CheckCircle2 : notice.status === "rejected" ? XCircle : Clock3; const read = readIds.has(notice.id); return <Link href={notice.href} className={`notification-card ${read ? "is-read" : ""}`} key={notice.id} onClick={() => onRead(notice.id)}><span className={`notification-icon is-${notice.status}`}><Icon size={18} /></span><div><b>{notice.title}</b><p>{notice.description}</p></div>{!read && <i aria-label="غير مقروء" />}</Link>; })}</div>; }

export default function Notifications() {
  const { isAuthenticated } = useSupabaseSession();
  const applications = trpc.brikouli.applications.mine.useQuery({}, { enabled: isAuthenticated, staleTime: 15_000 });
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const notices = useMemo<Notice[]>(() => buildApplicationNotices(applications.data?.success ? applications.data.data : []), [applications.data]);
  const { today, earlier } = groupNotices(notices);
  const markAllRead = () => setReadIds(value => markNoticesRead(value, notices.map(notice => notice.id)));
  return <AppShell><main className="jobseeker-page"><PageHeading eyebrow="متابعة النشاط" title="الإشعارات" action={notices.length ? <button type="button" className="mark-all-read" onClick={markAllRead}>تعليم الكل كمقروء</button> : undefined} /><p className="jobseeker-page-intro">تعرض هذه الصفحة تحديثات الطلبات المحفوظة في حسابك. لا تتطلب اتصالاً فورياً.</p>{!isAuthenticated ? <JobSeekerFeedback icon={<Bell size={28} />} title="سجّل الدخول لرؤية تحديثاتك" description="ستظهر هنا الحالات المرتبطة بطلباتك بعد تسجيل الدخول." action={<Link className="app-button app-button-primary" href="/login">تسجيل الدخول</Link>} /> : applications.isLoading ? <div className="jobseeker-page-list"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></div> : applications.isError || (applications.data && !applications.data.success) ? <JobSeekerLoadError onRetry={() => void applications.refetch()} /> : !notices.length ? <JobSeekerFeedback icon={<Bell size={28} />} title="لا توجد تحديثات بعد" description="عند إرسال طلب أو تغيّر حالته، ستظهر تحديثاته هنا." action={<Link className="app-button app-button-primary" href="/explore">استكشف الفرص</Link>} /> : <>{today.length > 0 && <section className="notification-group"><h2>اليوم</h2><NotificationCards items={today} readIds={readIds} onRead={id => setReadIds(value => markNoticesRead(value, [id]))} /></section>}{earlier.length > 0 && <section className="notification-group"><h2>سابقاً</h2><NotificationCards items={earlier} readIds={readIds} onRead={id => setReadIds(value => markNoticesRead(value, [id]))} /></section>}</>}</main></AppShell>;
}
