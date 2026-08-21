/** Style: «دفتر الحيّ» — a compact glass header that preserves focus on nearby work. */
import { Bell, Menu, Search } from "lucide-react";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type TopNavProps = { onPlaceholder: (label: string) => void };

export function TopNav({ onPlaceholder }: TopNavProps) {
  return <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5"><nav className="nav-shell mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-3 rounded-[22px] px-3.5 sm:px-5"><BrandLogo /><div className="hidden items-center gap-7 lg:flex"><a className="nav-link nav-link-active" href="#home">الرئيسية</a><a className="nav-link" href="#how-it-works">كيف يعمل</a><a className="nav-link" href="#categories">الفئات</a><a className="nav-link" href="#benefits">لماذا بريكولي</a></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => onPlaceholder("البحث")} className="icon-control hidden sm:inline-flex" aria-label="بحث"><Search size={19} /></button><button type="button" onClick={() => onPlaceholder("الإشعارات")} className="icon-control relative" aria-label="الإشعارات"><Bell size={19} /><span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-green ring-2 ring-white dark:ring-[#17372A]" /></button><ThemeToggle /><button type="button" onClick={() => onPlaceholder("القائمة")} className="icon-control inline-flex lg:hidden" aria-label="القائمة"><Menu size={20} /></button><button type="button" onClick={() => onPlaceholder("ابدأ الآن")} className="primary-cta hidden min-h-11 px-5 text-sm sm:inline-flex">ابدأ الآن</button></div></nav></header>;
}
