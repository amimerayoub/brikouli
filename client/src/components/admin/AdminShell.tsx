import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, ClipboardList, FileWarning, LayoutDashboard, LogOut, Menu, Megaphone, ShieldAlert, ShieldCheck, Users, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc";

const entries = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/gigs", label: "مراجعة الفرص", icon: ClipboardList },
  { href: "/admin/reports", label: "البلاغات", icon: FileWarning },
  { href: "/admin/moderation", label: "طابور السلامة", icon: ShieldCheck },
  { href: "/admin/sponsored", label: "الفرص المروّجة", icon: Megaphone },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "سجل التدقيق", icon: ClipboardList },
  { href: "/admin/security", label: "مراقبة الأمان", icon: ShieldAlert },
];

function AdminLoading() { return <main className="admin-access" aria-busy="true"><div className="admin-access-card"><ShieldCheck size={30} aria-hidden="true" /><h1>جارٍ التحقق من الوصول</h1><p>نراجع صلاحية الجلسة من المصدر الموثوق.</p></div></main>; }
function AdminForbidden() { return <main className="admin-access"><div className="admin-access-card"><ShieldCheck size={30} aria-hidden="true" /><h1>الوصول غير متاح</h1><p>هذه منطقة إدارية مستقلة ولا تعرض أي بيانات للحسابات غير المصرّح لها.</p><Link href="/">العودة إلى بريكولي</Link></div></main>; }

export function AdminShell({ children, title, description }: { children: ReactNode; title: string; description?: string }) {
  const { user, loading } = useSupabaseSession(); const [location, setLocation] = useLocation(); const [drawerOpen, setDrawerOpen] = useState(false);
  const profile = trpc.brikouli.profile.me.useQuery(undefined, { enabled: Boolean(user) });
  useEffect(() => { if (!loading && !user) setLocation(`/login?next=${encodeURIComponent(location)}`); }, [loading, user, location, setLocation]);
  if (loading || (user && profile.isLoading)) return <AdminLoading />;
  if (!user) return <AdminLoading />;
  if (!profile.data?.success || profile.data.data.role !== "admin") return <AdminForbidden />;
  const closeDrawer = () => setDrawerOpen(false);
  const signOut = async () => { await getSupabaseBrowserClient().auth.signOut(); setLocation("/login"); };
  return <div className="admin-shell" dir="rtl">
    <aside className={`admin-sidebar ${drawerOpen ? "is-open" : ""}`} aria-label="تنقل الإدارة">
      <div className="admin-brand"><span className="admin-brand-mark" aria-hidden="true">ب</span><span><b>بريكولي</b><small>إدارة المنصة</small></span><button className="admin-drawer-close" onClick={closeDrawer} aria-label="إغلاق القائمة"><X size={20} /></button></div>
      <nav>{entries.map(entry => { const active = location === entry.href; const Icon = entry.icon; return <Link key={entry.href} href={entry.href} onClick={closeDrawer} className={active ? "active" : ""}><Icon size={19} aria-hidden="true" /><span>{entry.label}</span></Link>; })}</nav>
      <footer><div className="admin-profile"><span>{profile.data.data.fullName.slice(0, 1) || "م"}</span><div><b>{profile.data.data.fullName || "مسؤول المنصة"}</b><small>مسؤول موثوق</small></div></div><button onClick={signOut}><LogOut size={18} aria-hidden="true" />تسجيل الخروج</button></footer>
    </aside>
    {drawerOpen && <button className="admin-drawer-backdrop" onClick={closeDrawer} aria-label="إغلاق القائمة" />}
    <section className="admin-main"><header className="admin-header"><button className="admin-menu-toggle" onClick={() => setDrawerOpen(true)} aria-label="فتح قائمة الإدارة"><Menu size={22} /></button><div><p>منطقة مقيدة</p><h1>{title}</h1>{description && <span>{description}</span>}</div><div className="admin-header-mark"><ShieldCheck size={19} aria-hidden="true" />مسؤول</div></header><main className="admin-content">{children}</main></section>
  </div>;
}
