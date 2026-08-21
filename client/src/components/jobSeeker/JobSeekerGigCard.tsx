import React from "react";
import { motion } from "framer-motion";
import { Bookmark, Clock3, MapPin, Wallet } from "lucide-react";
import { Link } from "wouter";
import type { JobSeekerGig } from "@shared/brikouli.types";
import { StatusBadge } from "@/components/phase3/StatusBadge";

type JobSeekerGigCardProps = {
  gig: JobSeekerGig;
  isSaved?: boolean;
  onToggleSave?: (gig: JobSeekerGig) => void;
  distanceLabel?: string;
  compact?: boolean;
  footer?: React.ReactNode;
};

function initials(name: string) {
  return name.trim().slice(0, 1) || "ب";
}

export function jobAgeLabel(createdAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 60) return "نُشرت الآن";
  if (minutes < 1_440) return `منذ ${Math.floor(minutes / 60)} س`;
  return `منذ ${Math.floor(minutes / 1_440)} ي`;
}

export function JobSeekerGigCard({ gig, isSaved = false, onToggleSave, distanceLabel, compact = false, footer }: JobSeekerGigCardProps) {
  return (
    <motion.article className={`job-seeker-gig-card ${compact ? "is-compact" : ""}`} whileHover={{ y: -3 }} whileTap={{ scale: 0.987 }} transition={{ duration: 0.2 }}>
      <div className="job-seeker-gig-card-top">
        <div className="job-seeker-employer-mark" aria-hidden="true">{initials(gig.employerName)}</div>
        <div className="job-seeker-gig-heading">
          <div className="job-seeker-gig-meta-row">
            <span className="job-seeker-category">{gig.category}</span>
            {gig.urgent && <StatusBadge type="urgent" />}
            <time dateTime={gig.createdAt}>{jobAgeLabel(gig.createdAt)}</time>
          </div>
          <Link href={`/jobs/${gig.id}`} className="job-seeker-gig-title">{gig.title}</Link>
          <p>{gig.employerName}</p>
        </div>
        <motion.button
          className={`job-seeker-save ${isSaved ? "is-saved" : ""}`}
          type="button"
          aria-label={isSaved ? "إزالة من المحفوظات" : "حفظ الفرصة"}
          aria-pressed={isSaved}
          onClick={() => onToggleSave?.(gig)}
          whileTap={{ scale: 0.86 }}
          transition={{ duration: 0.14 }}
        >
          <Bookmark size={19} fill={isSaved ? "currentColor" : "none"} />
        </motion.button>
      </div>
      <div className="job-seeker-gig-facts" aria-label="تفاصيل الفرصة">
        <span><Wallet size={15} /> <b>{gig.payment} د.م</b></span>
        <span><Clock3 size={15} /> {gig.duration}</span>
        <span><MapPin size={15} /> {distanceLabel ?? gig.neighborhood ?? gig.city}</span>
      </div>
      {footer ?? (!compact && <div className="job-seeker-gig-actions"><Link href={`/jobs/${gig.id}`} className="job-seeker-detail-link">عرض التفاصيل</Link><Link href={`/jobs/${gig.id}#apply`} className="job-seeker-apply-link">قدّم الآن</Link></div>)}
    </motion.article>
  );
}
