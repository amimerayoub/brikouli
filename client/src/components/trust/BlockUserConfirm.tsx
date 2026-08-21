import React, { useState } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/phase3/BottomSheet";
import { trpc } from "@/lib/trpc";

export function BlockUserConfirm({ userId, userName, onBlocked }: { userId: string; userName: string; onBlocked?: () => void }) { const [open, setOpen] = useState(false); const block = trpc.brikouli.blocks.set.useMutation({ onSuccess: result => { if (!result.success) return toast.error(result.message); toast.success("تم حظر الحساب ومنع التفاعل المباشر."); setOpen(false); onBlocked?.(); }, onError: () => toast.error("تعذر حظر الحساب الآن.") }); return <><button type="button" onClick={() => setOpen(true)}><Ban size={16}/>حظر المستخدم</button><BottomSheet open={open} onClose={() => setOpen(false)} title="حظر المستخدم"><div className="block-confirm-sheet"><Ban size={26}/><h2>هل أنت متأكد من حظر {userName}؟</h2><p>سيتم منع الرسائل والتفاعلات الجديدة بينكما. يمكنك إلغاء الحظر لاحقاً من إعدادات الأمان.</p><div><button type="button" className="app-button app-button-secondary" onClick={() => setOpen(false)}>إلغاء</button><button type="button" className="app-button app-button-danger" onClick={() => block.mutate({ userId, blocked: true })} disabled={block.isPending}>{block.isPending ? "جارٍ الحظر…" : "حظر المستخدم"}</button></div></div></BottomSheet></>; }
