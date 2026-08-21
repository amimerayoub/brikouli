import type { HTMLAttributes, ReactNode } from "react";
export function GlassCard({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) { return <div {...props} className={`glass-card ${className}`}>{children}</div>; }
