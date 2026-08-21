import { ArrowLeft, BadgeCheck, MapPin, Wallet } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { NearbyGig } from "@shared/brikouli.types";
import { formatDistance } from "@/lib/map/distance";
import { AppButton } from "@/components/phase3/AppButton";
export function MarkerPopup({ gig, onClose }: { gig: NearbyGig; onClose: () => void }) { return <div className="marker-popup"><div className="marker-popup-head"><span className="category-pill">{gig.category}</span><button type="button" onClick={onClose} aria-label="إغلاق تفاصيل المهمة">×</button></div><h2>{gig.title}</h2><p className="marker-employer"><BadgeCheck size={15} /> {gig.employerName}</p><div className="marker-popup-meta"><span><Wallet size={16} /> {gig.payment} د.م</span><span><MapPin size={16} /> {formatDistance(gig.distanceMeters)}</span></div><div className="marker-popup-actions"><Link href={`/jobs/${gig.id}`} className="app-button app-button-secondary">التفاصيل <ArrowLeft size={15} /></Link><AppButton onClick={() => toast.info("سيُتاح التقديم بعد إكمال تدفق الطلبات")}>قدّم الآن</AppButton></div></div>; }
