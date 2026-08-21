import { useEffect, useState } from "react";
import { Bell, Bookmark, ChevronLeft, ClipboardList, MapPin, Pencil, ShieldCheck, Star } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AppShell, PageHeading } from "@/components/phase3/AppShell";
import { JobSeekerCardSkeleton, JobSeekerFeedback, JobSeekerLoadError } from "@/components/jobSeeker/JobSeekerFeedback";

export default function Profile() {
  const { isAuthenticated } = useSupabaseSession();
  const profile = trpc.brikouli.profile.me.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const saved = trpc.brikouli.favorites.list.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const applications = trpc.brikouli.applications.mine.useQuery({}, { enabled: isAuthenticated, staleTime: 15_000 });
  const update = trpc.brikouli.profile.update.useMutation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", city: "", neighborhood: "" });
  const person = profile.data?.success ? profile.data.data : null;
  const savedCount = saved.data?.success ? saved.data.data.length : 0;
  const applicationCount = applications.data?.success ? applications.data.data.length : 0;
  useEffect(() => { if (person) setForm({ fullName: person.fullName, phone: person.phone ?? "", city: person.city ?? "", neighborhood: person.neighborhood ?? "" }); }, [person]);
  const saveProfile = () => { update.mutate({ fullName: form.fullName, phone: form.phone || undefined, city: form.city || undefined, neighborhood: form.neighborhood || undefined }, { onSuccess: response => { if (!response.success) { toast.error(response.message); return; } toast.success("تم حفظ بيانات الملف الشخصي"); setEditing(false); void profile.refetch(); }, onError: () => toast.error("تعذر حفظ بياناتك الآن.") }); };
  if (!isAuthenticated) return <AppShell><main className="jobseeker-page"><JobSeekerFeedback icon={<ShieldCheck size={28} />} title="سجّل الدخول لعرض ملفك" description="يمكنك من هنا حفظ الفرص، متابعة الطلبات، وتحديث بياناتك الأساسية." action={<Link className="app-button app-button-primary" href="/login">تسجيل الدخول</Link>} /></main></AppShell>;
  if (profile.isLoading) return <AppShell><main className="jobseeker-page"><JobSeekerCardSkeleton /><JobSeekerCardSkeleton /></main></AppShell>;
  if (!person) return <AppShell><main className="jobseeker-page"><JobSeekerLoadError onRetry={() => void profile.refetch()} /></main></AppShell>;
  return <AppShell><section className="profile-hero jobseeker-profile-hero"><PageHeading eyebrow="حسابي" title="ملفك الشخصي" /><div className="profile-card"><div className="profile-avatar">{person.fullName.slice(0, 1) || "ب"}</div><div><h2>{person.fullName}</h2><p>{person.city ?? "أضف مدينتك لتتعرّف إلى الفرص الأقرب."}</p></div><button type="button" onClick={() => setEditing(value => !value)}><Pencil size={16} /> {editing ? "إلغاء" : "تعديل"}</button></div>{editing && <form className="profile-edit-form" onSubmit={event => { event.preventDefault(); saveProfile(); }}><label>الاسم الكامل<input required value={form.fullName} onChange={event => setForm(value => ({ ...value, fullName: event.target.value }))} /></label><label>رقم الهاتف <small>اختياري</small><input dir="ltr" value={form.phone} onChange={event => setForm(value => ({ ...value, phone: event.target.value }))} /></label><label>المدينة<input value={form.city} onChange={event => setForm(value => ({ ...value, city: event.target.value }))} /></label><label>الحي <small>اختياري</small><input value={form.neighborhood} onChange={event => setForm(value => ({ ...value, neighborhood: event.target.value }))} /></label><button className="app-button app-button-primary" disabled={update.isPending}>{update.isPending ? "جارٍ الحفظ…" : "حفظ التغييرات"}</button></form>}<div className="profile-stats"><div><Star size={17} /><span>التقييم</span><b>{person.completedJobs > 0 ? `${person.rating.toFixed(1)} / 5` : "لا تقييمات بعد"}</b></div><div><ClipboardList size={17} /><span>الطلبات</span><b>{applicationCount}</b></div><div><MapPin size={17} /><span>المدينة</span><b>{person.city ?? "لم تُحدد"}</b></div></div></section><section className="phase-section profile-activity"><PageHeading eyebrow="نشاطك" title="متابعة سريعة" /><div className="profile-activity-links"><Link href="/saved"><span><Bookmark size={20} /></span><div><b>المحفوظات</b><small>{savedCount ? `${savedCount} فرص محفوظة` : "لا توجد فرص محفوظة"}</small></div><ChevronLeft size={18} /></Link><Link href="/applications"><span><ClipboardList size={20} /></span><div><b>طلباتي</b><small>{applicationCount ? `${applicationCount} طلبات مرسلة` : "لم ترسل طلباً بعد"}</small></div><ChevronLeft size={18} /></Link><Link href="/notifications"><span><Bell size={20} /></span><div><b>الإشعارات</b><small>تابع تحديثات الحساب والطلبات</small></div><ChevronLeft size={18} /></Link></div></section></AppShell>;
}
