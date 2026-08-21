/** Style: «دفتر الحيّ» — a layered opportunity clipping, informative before decorative. */
import type { ReactNode } from "react";
import { ArrowLeft, Clock3, MapPin, Wallet } from "lucide-react";

export type JobCardProps = { title: string; business: string; initials: string; category: string; distance: string; payment: string; duration: string; urgent?: boolean; verified?: boolean; onAction: () => void };

export function JobCard({ title, business, initials, category, distance, payment, duration, urgent = false, verified = false, onAction }: JobCardProps) {
  return <article className="job-card"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="avatar-mark" aria-hidden="true">{initials}</div><div className="min-w-0"><h3 className="truncate text-[1rem] font-extrabold tracking-[-0.02em] text-ink dark:text-white">{title}</h3><p className="mt-1 text-xs font-medium text-slate-500 dark:text-emerald-100/60">{business}</p></div></div><div className="flex flex-wrap justify-end gap-1.5">{urgent && <span className="badge badge-urgent">عاجلة</span>}{verified && <span className="badge badge-verified">موثّق</span>}</div></div><div className="my-4 h-px bg-emerald-950/[0.07] dark:bg-white/[0.08]" /><div className="grid grid-cols-3 gap-2"><JobMeta icon={<MapPin size={15} />} label="بالقرب منك" value={distance} /><JobMeta icon={<Wallet size={15} />} label="المقابل" value={payment} emphasis /><JobMeta icon={<Clock3 size={15} />} label="المدة" value={duration} /></div><div className="mt-4 flex items-center justify-between gap-3"><span className="category-label">{category}</span><button type="button" className="job-action" onClick={onAction}>التفاصيل <ArrowLeft size={16} /></button></div></article>;
}

function JobMeta({ icon, label, value, emphasis = false }: { icon: ReactNode; label: string; value: string; emphasis?: boolean }) {
  return <div className="min-w-0"><div className="mb-1 flex items-center gap-1 text-[0.65rem] font-semibold text-slate-500 dark:text-emerald-100/55">{icon}<span className="truncate">{label}</span></div><p className={`truncate text-[0.77rem] font-extrabold ${emphasis ? "text-brand-green" : "text-ink dark:text-white"}`}>{value}</p></div>;
}
