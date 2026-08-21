/** Style: «دفتر الحيّ» — native-like bottom navigation with calm, legible task cues. */
import { House, MessageCircle, Plus, Search, UserRound } from "lucide-react";

const items = [{ label: "الرئيسية", icon: House, active: true }, { label: "استكشف", icon: Search }, { label: "نشر مهمة", icon: Plus, raised: true }, { label: "الرسائل", icon: MessageCircle }, { label: "حسابي", icon: UserRound }];
type BottomNavProps = { onPlaceholder: (label: string) => void };

export function BottomNav({ onPlaceholder }: BottomNavProps) {
  return <nav className="bottom-nav lg:hidden" aria-label="التنقل الرئيسي"><div className="bottom-nav-shell">{items.map(({ label, icon: Icon, active, raised }) => <button type="button" key={label} onClick={() => onPlaceholder(label)} className={`bottom-nav-item ${active ? "bottom-nav-item-active" : ""} ${raised ? "bottom-nav-item-raised" : ""}`}>{raised ? <span className="plus-orb"><Icon size={22} strokeWidth={2.4} /></span> : <Icon size={20} strokeWidth={active ? 2.5 : 1.9} />}<span>{label}</span></button>)}</div></nav>;
}
