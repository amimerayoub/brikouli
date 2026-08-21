import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export function AdminConfirmDialog({ open, title, description, confirmLabel, danger = false, busy = false, onConfirm, onClose }: { open: boolean; title: string; description: string; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null); useEffect(() => { if (open) confirmRef.current?.focus(); }, [open]); if (!open) return null;
  return <div className="admin-dialog-layer" role="presentation"><button className="admin-dialog-backdrop" aria-label="إغلاق نافذة التأكيد" onClick={onClose} /><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title"><button className="admin-dialog-close" onClick={onClose} aria-label="إغلاق"><X size={19} /></button><span className={danger ? "danger" : ""}><AlertTriangle size={23} /></span><h2 id="admin-confirm-title">{title}</h2><p>{description}</p><footer><button className="admin-button admin-button-quiet" onClick={onClose} disabled={busy}>إلغاء</button><button ref={confirmRef} className={`admin-button ${danger ? "admin-button-danger" : "admin-button-primary"}`} onClick={onConfirm} disabled={busy}>{busy ? "جارٍ التنفيذ…" : confirmLabel}</button></footer></section></div>;
}
