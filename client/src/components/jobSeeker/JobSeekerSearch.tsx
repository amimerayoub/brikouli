import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";

type JobSeekerSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onOpenFilters?: () => void;
  placeholder?: string;
  label?: string;
};

export function JobSeekerSearch({ value, onChange, onOpenFilters, placeholder = "ابحث عن فرصة، متجر أو مدينة", label = "البحث في الفرص" }: JobSeekerSearchProps) {
  return <label className="job-seeker-search"><span className="sr-only">{label}</span><Search size={19} aria-hidden="true" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} type="search" autoComplete="off" /><AnimatePresence initial={false}>{value && <motion.button type="button" className="job-seeker-search-clear" aria-label="مسح البحث" onClick={() => onChange("")} initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .94 }}><X size={17} /></motion.button>}</AnimatePresence>{onOpenFilters && <button type="button" className="job-seeker-search-filter" onClick={onOpenFilters} aria-label="فتح عوامل التصفية"><SlidersHorizontal size={18} /></button>}</label>;
}
