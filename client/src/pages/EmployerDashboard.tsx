import React from "react";
import { BriefcaseBusiness, CheckCheck, ClipboardList, Plus, TrendingUp, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { EmployerAccessState, EmployerShell } from "@/components/employer/EmployerShell";
import { JobSeekerCardSkeleton, JobSeekerLoadError } from "@/components/jobSeeker/JobSeekerFeedback";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

function Chart({ title, values, color }: { title: string; values: number[]; color: string }) { const max = Math.max(1, ...values); return <section className="employer-chart-card"><div><h2>{title}</h2><small>آخر البيانات المسجلة في نشاطك</small></div><div className="employer-bars" aria-label={title}>{values.map((value, index) => <span key={index} style={{ height: `${Math.max(8, (value / max) * 100)}%`, background: color }} title={String(value)} />)}</div></section>; }

export default function EmployerDashboard() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useSupabaseSession();
  const dashboard = trpc.brikouli.employer.dashboard.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const create = () => setLocation("/employer/new");
  if (loading) return <div className="employer-loading"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></div>;
  if (!isAuthenticated) return <EmployerAccessState type="login" />;
  if (dashboard.isLoading) return <EmployerShell title="أهلاً بك" subtitle="نحضّر ملخص نشاطك"><div className="employer-loading"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></div></EmployerShell>;
  if (dashboard.isError || !dashboard.data?.success) return <EmployerAccessState type="forbidden" />;
  const data = dashboard.data.data;
  const cards = [
    { label: "الفرص النشطة", value: data.stats.activeGigs, icon: BriefcaseBusiness, tone: "green" },
    { label: "طلبات قيد المراجعة", value: data.stats.pendingApplications, icon: ClipboardList, tone: "ochre" },
    { label: "إجمالي التعيينات", value: data.stats.totalHires, icon: CheckCheck, tone: "blue" },
    { label: "معدل القبول", value: `${data.stats.acceptanceRate}%`, icon: TrendingUp, tone: "violet" },
  ];
  return <EmployerShell title="أهلاً بك في نشاطك" subtitle="تابع فرصك وطلباتك واتخذ قرارات واضحة في مكان واحد." onCreate={create}><section className="employer-welcome"><div><p className="eyebrow">نظرة اليوم</p><h2>حافظ على سير فرصك بخطوات بسيطة.</h2><p>تظهر الأرقام التالية من فرصك وطلباتك المسجلة، من دون أي بيانات تجريبية.</p></div><button type="button" className="app-button app-button-light" onClick={create}><Plus size={18} /> نشر فرصة</button></section><section className="employer-stat-grid">{cards.map(card => { const Icon = card.icon; return <article className={`employer-stat-card tone-${card.tone}`} key={card.label}><span><Icon size={20} /></span><small>{card.label}</small><strong>{card.value}</strong></article>; })}</section><section className="employer-overview-grid"><Chart title="النشاط الأسبوعي" values={data.weeklyActivity.map(item => item.gigs + item.applications)} color="var(--employer-green)" /><Chart title="التعيينات الشهرية" values={data.monthlyHires.map(item => item.hires)} color="var(--employer-ochre)" /></section><section className="employer-quick-actions"><div><p className="eyebrow">اختصارات عملية</p><h2>اختر ما تريد إنجازه الآن</h2></div><div><button type="button" onClick={create}><Plus size={20} /> نشر فرصة</button><button type="button" onClick={() => toast.info("ستظهر الطلبات الحديثة هنا فور وصولها.")}><UsersRound size={20} /> مراجعة المتقدمين</button><button type="button" onClick={() => toast.info(`لديك ${data.stats.totalGigs} فرصة مسجلة.`)}><BriefcaseBusiness size={20} /> فرصي</button></div></section></EmployerShell>;
}
