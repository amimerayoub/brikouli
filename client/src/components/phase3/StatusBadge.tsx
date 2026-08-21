import React from "react";
import { BadgeCheck, Zap } from "lucide-react";
export function StatusBadge({ type }: { type: "urgent" | "verified" | "new" }) { const content = type === "urgent" ? <><Zap size={12} /> عاجل</> : type === "verified" ? <><BadgeCheck size={12} /> موثّق</> : <>جديد</>; return <span className={`status-badge status-badge-${type}`}>{content}</span>; }
