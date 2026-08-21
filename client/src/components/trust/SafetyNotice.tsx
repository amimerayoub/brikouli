import React from "react";
import { ShieldAlert } from "lucide-react";
export function SafetyNotice({ compact = false }: { compact?: boolean }) { return <aside className={`safety-contextual-note ${compact ? "is-compact" : ""}`}><ShieldAlert size={compact ? 17 : 20}/><div><b>نصيحة للسلامة</b><p>{compact ? "لا تشارك كلمات المرور أو التفاصيل البنكية في المحادثة." : "تحقق من تفاصيل المهمة قبل قبولها، ولا تشارك كلمات المرور أو البيانات البنكية. ارفض أي عمل قد يعرضك للخطر."}</p></div></aside>; }
