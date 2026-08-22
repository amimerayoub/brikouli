import React, { type ReactNode, useMemo, useState } from "react";
import { BarChart3, Bell, Bookmark, BriefcaseBusiness, Building2, ClipboardList, House, LogOut, Menu, MessageCircle, Plus, Search, Settings, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import type { BrikouliProfile, UserRole } from "@shared/brikouli.types";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc";

type NavigationItem = { label: string; href: string; icon: typeof House; raised?: boolean };
type ProfileMenuItem = { label: string; href: string; icon: typeof UserRound };

const jobSeekerDesktopNavigation: NavigationItem[] = [
  { label: "الرئيسية", href: "/", icon: House },
  { label: "استكشف", href: "/explore", icon: Search },
];
const employerDesktopNavigation: NavigationItem[] = [
  { label: "الرئيسية", href: "/", icon: House },
  { label: "لوحة الأعمال", href: "/employer", icon: BriefcaseBusiness },
  { label: "نشر مهمة", href: "/employer/new", icon: Plus },
];
const jobSeekerMobileNavigation: NavigationItem[] = [
  { label: "الرئيسية", href: "/", icon: House },
  { label: "استكشف", href: "/explore", icon: Search },
  { label: "الرسائل", href: "/messages", icon: MessageCircle },
  { label: "حسابي", href: "/profile", icon: UserRound },
];
const employerMobileNavigation: NavigationItem[] = [
  { label: "الرئيسية", href: "/", icon: House },
  { label: "لوحة الأعمال", href: "/employer", icon: BriefcaseBusiness },
  { label: "نشر مهمة", href: "/employer/new", icon: Plus, raised: true },
  { label: "الرسائل", href: "/messages", icon: MessageCircle },
  { label: "حسابي", href: "/employer/profile", icon: UserRound },
];

const jobSeekerProfileMenu: ProfileMenuItem[] = [
  { label: "الملف الشخصي", href: "/profile", icon: UserRound },
  { label: "الوظائف المحفوظة", href: "/saved", icon: Bookmark },
  { label: "طلباتي", href: "/applications", icon: ClipboardList },
  { label: "الإعدادات", href: "/safety", icon: Settings },
];
const employerProfileMenu: ProfileMenuItem[] = [
  { label: "الملف التجاري", href: "/employer/profile", icon: Building2 },
  { label: "مهامي", href: "/employer/gigs", icon: BriefcaseBusiness },
  { label: "الطلبات الواردة", href: "/employer/applicants", icon: ClipboardList },
  { label: "الإحصائيات", href: "/employer", icon: BarChart3 },
  { label: "الإعدادات", href: "/employer/profile#settings", icon: Settings },
];

function isCurrentPath(location: string, href: string) {
  return href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);
}

function navigationFor(role: UserRole | undefined) {
  return role === "employer" ? employerDesktopNavigation : jobSeekerDesktopNavigation;
}

function mobileNavigationFor(role: UserRole | undefined) {
  return role === "employer" ? employerMobileNavigation : jobSeekerMobileNavigation;
}

export function PhaseBottomNavigation({ activePath, role }: { activePath: string; role?: UserRole }) {
  return <nav className="phase-bottom-nav" aria-label="التنقل الرئيسي">{mobileNavigationFor(role).map(({ label, href, icon: Icon, raised }) => <Link key={href} href={href} className={`${isCurrentPath(activePath, href) ? "is-active" : ""} ${raised ? "is-raised" : ""}`}><span>{raised ? <span className="nav-plus"><Plus size={21} /></span> : <Icon size={20} />}</span><small>{label}</small></Link>)}</nav>;
}

function ProfileMenu({ profile, onClose, onLogout }: { profile: BrikouliProfile; onClose: () => void; onLogout: () => void }) {
  const items = profile.role === "employer" ? employerProfileMenu : jobSeekerProfileMenu;
  return <div className="desktop-profile-menu" role="menu" aria-label="قائمة الحساب">{items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} role="menuitem" onClick={onClose}><Icon size={16} />{label}</Link>)}<button type="button" role="menuitem" onClick={onLogout}><LogOut size={16} />تسجيل الخروج</button></div>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useSupabaseSession();
  const profileQuery = trpc.brikouli.profile.me.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;
  const inboxQuery = trpc.brikouli.messaging.list.useQuery({ query: "", includeArchived: false }, { enabled: Boolean(profile), staleTime: 15_000 });
  const unreadMessages = inboxQuery.data?.success ? inboxQuery.data.data.reduce((total, conversation) => total + conversation.unreadCount, 0) : 0;
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const desktopNavigation = useMemo(() => navigationFor(profile?.role), [profile?.role]);

  const signOut = async () => {
    try {
      await getSupabaseBrowserClient().auth.signOut();
      setProfileMenuOpen(false);
      setLocation("/");
      toast.success("تم تسجيل الخروج.");
    } catch {
      toast.error("تعذر تسجيل الخروج الآن.");
    }
  };

  return <div className="phase-app-shell"><header className="phase-header"><div className="phase-header-inner"><Link href="/" className="phase-brand"><BrandLogo /></Link><nav className="phase-desktop-nav" aria-label="التنقل الرئيسي">{desktopNavigation.map(item => <Link key={item.href} href={item.href} className={isCurrentPath(location, item.href) ? "is-active" : ""}>{item.label}</Link>)}</nav><div className="phase-header-actions"><button type="button" aria-label="بحث" onClick={() => setLocation("/explore")}><Search size={19} /></button><button type="button" aria-label="الإشعارات" onClick={() => setLocation(profile?.role === "employer" ? "/employer/notifications" : "/notifications")}><Bell size={19} /></button><Link href="/messages" className="desktop-header-only phase-header-action phase-message-action" aria-label={unreadMessages ? `الرسائل، ${unreadMessages} غير مقروءة` : "الرسائل"}><MessageCircle size={19} />{unreadMessages > 0 && <i aria-label={`${unreadMessages} رسالة غير مقروءة`}>{unreadMessages > 99 ? "99+" : unreadMessages}</i>}</Link>{profile ? <div className="desktop-header-only phase-profile-wrap"><button type="button" className="phase-profile-trigger" aria-label="فتح قائمة الحساب" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen(open => !open)}>{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.fullName.slice(0, 1) || "ب"}</span>}</button>{profileMenuOpen && <ProfileMenu profile={profile} onClose={() => setProfileMenuOpen(false)} onLogout={() => void signOut()} />}</div> : <Link href="/login" className="desktop-header-only phase-header-action" aria-label="تسجيل الدخول"><UserRound size={19} /></Link>}<ThemeToggle /><button className="header-menu" type="button" aria-label="فتح القائمة" onClick={() => toast.info("استخدم شريط التنقل السفلي للانتقال.")}><Menu size={20} /></button></div></div></header><main className="phase-main">{children}</main><PhaseBottomNavigation activePath={location} role={profile?.role} /></div>;
}

export function PageHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) { return <div className="page-heading"><div>{eyebrow && <p>{eyebrow}</p>}<h1>{title}</h1></div>{action}</div>; }
