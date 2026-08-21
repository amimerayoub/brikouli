import React from "react";
import { motion } from "framer-motion";

type JobSeekerCategoriesProps = {
  categories: readonly string[];
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
};

export function JobSeekerCategories({ categories, value, onChange, label = "تصنيفات الفرص" }: JobSeekerCategoriesProps) {
  return <div className="job-seeker-categories" role="group" aria-label={label}><motion.button type="button" className={!value ? "is-active" : ""} aria-pressed={!value} onClick={() => onChange(undefined)} whileTap={{ scale: .96 }}>الكل</motion.button>{categories.map(category => <motion.button key={category} type="button" className={value === category ? "is-active" : ""} aria-pressed={value === category} onClick={() => onChange(category)} whileTap={{ scale: .96 }}>{category}</motion.button>)}</div>;
}
