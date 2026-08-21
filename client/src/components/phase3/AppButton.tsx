import React, { type ButtonHTMLAttributes, type ReactNode } from "react";
type Variant = "primary" | "secondary" | "ghost" | "danger";
export function AppButton({ variant = "primary", children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) { return <button {...props} className={`app-button app-button-${variant} ${className}`}>{children}</button>; }
