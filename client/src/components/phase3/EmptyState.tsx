import React, { type ReactNode } from "react";
import { Inbox } from "lucide-react";
export function EmptyState({ icon = <Inbox size={26} />, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) { return <section className="empty-state"><span className="empty-state-icon">{icon}</span><h2>{title}</h2><p>{description}</p>{action}</section>; }
export function ErrorState({ onRetry }: { onRetry?: () => void }) { return <EmptyState title="حدث شيء غير متوقع" description="لم نتمكن من إكمال هذه الخطوة الآن. حاول مرة أخرى بهدوء." action={onRetry ? <button className="app-button app-button-secondary" onClick={onRetry}>إعادة المحاولة</button> : undefined} />; }
