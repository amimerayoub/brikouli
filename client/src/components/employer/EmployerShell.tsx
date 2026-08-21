import React from "react";
import { BarChart3, Bell, BriefcaseBusiness, LayoutDashboard, MenuSquare, Plus, Store, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { AppButton } from "@/components/phase3/AppButton";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const entries = [
  { href: "/employer", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/employer/gigs", label: "فرصي", icon: BriefcaseBusiness },
  { href: "/employer/applicants", label: "المتقدمون", icon: UsersRound },
  { href: "/employer/profile", label: "نشاطي", icon: Store },
];

export function EmployerAccessState({ type }: { type: "login" | "forbidden" }) {
  const { user } = useSupabaseSession();
  const title = type === "forbidden" ? "هذه المساحة مخصّصة لأصحاب الأعمال" : "سجّل الدخول لإدارة نشاطك";
  const description = type === "forbidden" ? "حسابك لا يملك صلاحية الوصول إلى مساحة صاحب العمل. استخدم حساب صاحب عمل أو تواصل معنا لتحديث نوع الحساب." : "أنشئ ونظّم الفرص وراجع المتقدمين من مساحة واحدة آمنة.";
  return <main className="employer-access-state"><div className="employer-access-icon"><Store size={28} /></div><p className="eyebrow">بريكولي للأعمال</p><h1>{title}</h1><p>{description}</p>{type === "login" ? <Link className="app-button app-button-primary" href="/login">تسجيل الدخول</Link> : <AppButton onClick={() => toast.info(`الحساب الحالي: ${user?.email ?? "غير معروف"}`)}>فهم الصلاحيات</AppButton>}</main>;
}

export function EmployerShell({ title, subtitle, children, onCreate }: { title: string; subtitle: string; children: React.ReactNode; onCreate?: () => void }) {
  const [location] = useLocation();
  return <div className="employer-shell" dir="rtl"><aside className="employer-sidebar"><Link href="/employer" className="employer-brand"><span>ب</span><div><b>بريكولي</b><small>مساحة الأعمال</small></div></Link><nav aria-label="تنقل صاحب العمل">{entries.map(entry => { const Icon = entry.icon; const selected = entry.href === "/employer" ? location === "/employer" : location.startsWith(entry.href); return <Link key={entry.href} href={entry.href} className={`employer-nav-link ${selected ? "is-active" : ""}`}><Icon size={19} /><span>{entry.label}</span></Link>; })}</nav><div className="employer-sidebar-note"><BarChart3 size={18} /><p>كل قرار في لوحة نشاطك يعتمد على بيانات فرصك وطلباتك الفعلية.</p></div></aside><section className="employer-main"><header className="employer-topbar"><div><p className="eyebrow">مساحة صاحب العمل</p><h1>{title}</h1><p>{subtitle}</p></div><div className="employer-top-actions"><Link href="/employer/notifications" aria-label="الإشعارات" className="employer-icon-button"><Bell size={20} /></Link><button type="button" aria-label="قائمة سريعة" className="employer-icon-button" onClick={() => toast.info("استخدم شريط التنقل لإدارة نشاطك.")}><MenuSquare size={20} /></button></div></header><div className="employer-content">{children}</div></section>{onCreate && <button type="button" className="employer-fab" onClick={onCreate} aria-label="نشر فرصة جديدة"><Plus size={23} /><span>نشر فرصة</span></button>}<nav className="employer-bottom-nav" aria-label="تنقل صاحب العمل على الهاتف">{entries.map(entry => { const Icon = entry.icon; const selected = entry.href === "/employer" ? location === "/employer" : location.startsWith(entry.href); return <Link key={entry.href} href={entry.href} className={selected ? "is-active" : ""}><Icon size={20} /><span>{entry.label}</span></Link>; })}</nav></div>;
}
