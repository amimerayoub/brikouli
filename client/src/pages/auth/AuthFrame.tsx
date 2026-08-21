import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { BrandLogo } from "@/components/branding/BrandLogo";

export function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="auth-page"><div className="auth-panel"><Link href="/" className="auth-back"><ArrowRight size={17} /> العودة للرئيسية</Link><BrandLogo className="mb-9" /><p className="eyebrow"><span className="brand-marker" aria-hidden="true"><i /></span> حساب بريكولي</p><h1>{title}</h1><p className="auth-description">{description}</p>{children}</div><aside className="auth-aside" aria-hidden="true"><div className="auth-aside-card"><span className="brand-marker brand-marker-light"><i /></span><p>خطوة بسيطة نحو فرصة أقرب إليك.</p><small>بريكولي منصة تقنية تربطك بالفرص المحلية.</small></div></aside></main>;
}

export function AuthFeedback({ message, tone = "error" }: { message?: string; tone?: "error" | "success" }) { return message ? <p className={`auth-feedback auth-feedback-${tone}`} role="status">{message}</p> : null; }
