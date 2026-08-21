import { useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AppShell, PageHeading } from "@/components/phase3/AppShell";
import { JobSeekerCardSkeleton, JobSeekerFeedback, JobSeekerLoadError } from "@/components/jobSeeker/JobSeekerFeedback";

type Tab = "all" | "pending" | "accepted" | "rejected";
const tabs: { id: Tab; label: string; icon: typeof Clock3 }[] = [{ id: "all", label: "الكل", icon: BriefcaseBusiness }, { id: "pending", label: "قيد المراجعة", icon: Clock3 }, { id: "accepted", label: "مقبولة", icon: CheckCircle2 }, { id: "rejected", label: "غير مكتملة", icon: XCircle }];

function applicationDate(value: string) { return new Intl.DateTimeFormat("ar-MA", { dateStyle: "medium" }).format(new Date(value)); }

export default function Applications() {
  const [tab, setTab] = useState<Tab>("all");
  const { isAuthenticated } = useSupabaseSession();
  const input = useMemo(() => ({ status: tab === "all" ? undefined : tab }), [tab]);
  const applications = trpc.brikouli.applications.mine.useQuery(input, { enabled: isAuthenticated, staleTime: 15_000 });
  const rows = applications.data?.success ? applications.data.data : [];
  return <AppShell><main className="jobseeker-page"><PageHeading eyebrow="رحلة التقديم" title="طلباتي" /><p className="jobseeker-page-intro">تابع حالة كل طلب بوضوح. ستظهر التحديثات هنا عند تغيّر حالته.</p><div className="application-tabs" role="tablist" aria-label="حالات الطلبات">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}><Icon size={15} /> {item.label}</button>; })}</div>{!isAuthenticated ? <JobSeekerFeedback icon={<BriefcaseBusiness size={28} />} title="سجّل الدخول لمتابعة طلباتك" description="يتم حفظ كل طلب في حسابك حتى تستطيع معرفة حالته لاحقاً." action={<Link className="app-button app-button-primary" href="/login">تسجيل الدخول</Link>} /> : applications.isLoading ? <div className="jobseeker-page-list"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></div> : applications.isError || (applications.data && !applications.data.success) ? <JobSeekerLoadError onRetry={() => void applications.refetch()} /> : rows.length === 0 ? <JobSeekerFeedback icon={<BriefcaseBusiness size={28} />} title="لا توجد طلبات في هذه الحالة" description="استكشف الفرص القريبة ثم قدّم عندما تجد ما يناسب وقتك ومهاراتك." action={<Link className="app-button app-button-primary" href="/explore">استكشف الفرص</Link>} /> : <div className="application-list">{rows.map(application => <article className={`application-row is-${application.status}`} key={application.id}><div className="application-status-icon">{application.status === "accepted" ? <CheckCircle2 size={19} /> : application.status === "rejected" ? <XCircle size={19} /> : <Clock3 size={19} />}</div><div><span className="application-status-label">{application.status === "accepted" ? "تم القبول" : application.status === "rejected" ? "لم تكتمل" : "قيد المراجعة"}</span><h2>{application.gig?.title ?? "فرصة لم تعد متاحة"}</h2><p>{application.gig?.employerName ?? "صاحب المنشور"} · قُدّم في {applicationDate(application.createdAt)}</p></div>{application.gig && <Link href={`/jobs/${application.gig.id}`} aria-label={`عرض ${application.gig.title}`}>عرض</Link>}</article>)}</div>}</main></AppShell>;
}
