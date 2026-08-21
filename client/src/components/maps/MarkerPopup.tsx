import React from "react";
import { ArrowLeft, BadgeCheck, Bookmark, MapPin, Wallet } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { NearbyGig } from "@shared/brikouli.types";
import { formatDistance } from "@/lib/map/distance";
import { AppButton } from "@/components/phase3/AppButton";

type MarkerPopupProps = {
  gig: NearbyGig;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
};

export function MarkerPopup({ gig, onClose, isSaved = false, onToggleSave }: MarkerPopupProps) {
  return <div className="marker-popup"><div className="marker-popup-head"><span className="category-pill">{gig.category}</span><button type="button" onClick={onClose} aria-label="إغلاق تفاصيل المهمة">×</button></div><h2>{gig.title}</h2><p className="marker-employer"><BadgeCheck size={15} /> {gig.employerName}</p><div className="marker-popup-meta"><span><Wallet size={16} /> {gig.payment} د.م</span><span><MapPin size={16} /> {formatDistance(gig.distanceMeters)}</span></div><div className="marker-popup-actions"><Link href={`/jobs/${gig.id}`} className="app-button app-button-secondary">التفاصيل <ArrowLeft size={15} /></Link><AppButton onClick={() => toast.info("افتح التفاصيل لمراجعة الفرصة قبل التقديم")}>قدّم الآن</AppButton></div>{onToggleSave && <button type="button" className={`marker-save-action ${isSaved ? "is-saved" : ""}`} onClick={onToggleSave} aria-pressed={isSaved}><Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "محفوظة في حسابك" : "حفظ الفرصة"}</button>}</div>;
}
